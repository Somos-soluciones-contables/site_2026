document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("contactFormStatus");
    const emailServiceId = "service_uj55qo7";
    const emailTemplateId = "template_rxmsflz";
    const emailPublicKey = "v5P3ENeGft_4Hd6si";
    const emailLibraryUrl = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js";

    if (!form || !status) {
        return;
    }

    const fields = Array.from(form.querySelectorAll("input, textarea")).filter((field) => field.name !== "empresa");
    const honeypotField = form.querySelector('[name="empresa"]');
    const submitButton = form.querySelector(".submit-button");
    let isSubmitting = false;
    let emailJsLoadPromise = null;
    let hasInitializedEmailJs = false;

    function initializeEmailJs() {
        if (!window.emailjs || hasInitializedEmailJs) {
            return;
        }

        window.emailjs.init({
            publicKey: emailPublicKey
        });

        hasInitializedEmailJs = true;
    }

    function loadEmailJs() {
        if (window.emailjs) {
            initializeEmailJs();
            return Promise.resolve(window.emailjs);
        }

        if (emailJsLoadPromise) {
            return emailJsLoadPromise;
        }

        emailJsLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = emailLibraryUrl;
            script.async = true;
            script.onload = () => {
                initializeEmailJs();
                resolve(window.emailjs);
            };
            script.onerror = () => {
                emailJsLoadPromise = null;
                reject(new Error("No se pudo cargar EmailJS."));
            };
            document.head.appendChild(script);
        });

        return emailJsLoadPromise;
    }

    function setStatus(message, type = "") {
        status.textContent = message;
        status.classList.remove("is-error", "is-success");

        if (type) {
            status.classList.add(`is-${type}`);
        }
    }

    function getFieldError(field) {
        const value = field.value.trim();

        if (!value) {
            return "Completa este campo.";
        }

        if (field.type === "email" && field.validity.typeMismatch) {
            return "Ingresa un correo electr\u00f3nico v\u00e1lido.";
        }

        return "";
    }

    function updateFieldState(field) {
        const isTouched = field.dataset.touched === "true";
        const errorMessage = getFieldError(field);
        const showInvalidState = isTouched && Boolean(errorMessage);

        field.classList.toggle("is-invalid", showInvalidState);
        field.setAttribute("aria-invalid", showInvalidState ? "true" : "false");

        return errorMessage;
    }

    function resetFieldState(field) {
        field.dataset.touched = "false";
        field.classList.remove("is-invalid");
        field.setAttribute("aria-invalid", "false");
    }

    function isSpamSubmission() {
        return Boolean(honeypotField?.value.trim());
    }

    function beginSubmitFeedback() {
        if (!submitButton) {
            return () => {};
        }

        submitButton.classList.remove("is-sending");
        submitButton.getBoundingClientRect();
        submitButton.classList.add("is-sending");
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");

        const animationTimeoutId = window.setTimeout(() => {
            submitButton.classList.remove("is-sending");
        }, 820);

        return () => {
            window.clearTimeout(animationTimeoutId);
            submitButton.classList.remove("is-sending");
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
        };
    }

    fields.forEach((field) => {
        resetFieldState(field);

        field.addEventListener("focus", () => {
            loadEmailJs().catch(() => {});
        }, { once: true });

        field.addEventListener("blur", () => {
            field.dataset.touched = "true";
            updateFieldState(field);
        });

        field.addEventListener("input", () => {
            if (field.dataset.touched === "true") {
                updateFieldState(field);
            }

            if (status.textContent && !isSubmitting) {
                setStatus("");
            }
        });
    });

    if ("IntersectionObserver" in window) {
        const contactObserver = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) {
                    return;
                }

                loadEmailJs().catch(() => {});
                contactObserver.disconnect();
            },
            {
                rootMargin: "360px 0px"
            }
        );

        contactObserver.observe(form);
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        let firstInvalidField = null;

        fields.forEach((field) => {
            field.dataset.touched = "true";
            const errorMessage = updateFieldState(field);

            if (!firstInvalidField && errorMessage) {
                firstInvalidField = field;
            }
        });

        if (firstInvalidField) {
            setStatus("Revisa los campos marcados antes de enviar la consulta.", "error");
            firstInvalidField.focus();
            return;
        }

        if (isSpamSubmission()) {
            setStatus("Consulta enviada correctamente. Te responderemos a la brevedad.", "success");
            form.reset();
            fields.forEach(resetFieldState);
            return;
        }

        const resetSubmitFeedback = beginSubmitFeedback();
        const formData = Object.fromEntries(new FormData(form).entries());

        isSubmitting = true;
        setStatus("Estamos enviando tu consulta...");

        try {
            const emailjs = await loadEmailJs();

            if (!emailjs) {
                throw new Error("EmailJS no disponible.");
            }

            await emailjs.send(emailServiceId, emailTemplateId, {
                nombre: formData.nombre,
                telefono: formData.telefono,
                email: formData.email,
                mensaje: formData.mensaje
            });

            setStatus("Consulta enviada correctamente. Te responderemos a la brevedad.", "success");
            form.reset();
            fields.forEach(resetFieldState);
        } catch (error) {
            setStatus("No pudimos enviar la consulta. Intenta nuevamente en unos minutos.", "error");
        } finally {
            isSubmitting = false;
            resetSubmitFeedback();
        }
    });
});
