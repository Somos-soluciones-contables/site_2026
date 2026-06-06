document.addEventListener("DOMContentLoaded", () => {
    const lowPowerMode = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 760px)");
    const deferredStylesheets = Array.from(document.querySelectorAll("[data-deferred-stylesheet][data-href]"));
    const deferredImages = Array.from(document.querySelectorAll("img[data-lazy-src]"));
    let hasLoadedIconStylesheet = false;

    function loadIconStylesheet() {
        if (hasLoadedIconStylesheet) {
            return;
        }

        hasLoadedIconStylesheet = true;
        deferredStylesheets.forEach((link) => {
            link.href = link.dataset.href;
            link.removeAttribute("data-href");
        });
    }

    function loadDeferredImage(image) {
        const pendingSrc = image.dataset.lazySrc;

        if (!pendingSrc) {
            return;
        }

        image.src = pendingSrc;
        image.removeAttribute("data-lazy-src");
    }

    function observeDeferredImages() {
        if (!deferredImages.length) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            deferredImages.forEach(loadDeferredImage);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    loadDeferredImage(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            {
                rootMargin: lowPowerMode.matches ? "120px 0px" : "420px 0px",
                threshold: 0.01
            }
        );

        deferredImages.forEach((image) => observer.observe(image));
    }

    function observeIconSections() {
        if (!deferredStylesheets.length) {
            return;
        }

        const iconHosts = Array.from(document.querySelectorAll(".team-section, .services-section, .clients-section, .contact-section"));

        if (!iconHosts.length || !("IntersectionObserver" in window)) {
            window.addEventListener("load", loadIconStylesheet, { once: true });
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) {
                    return;
                }

                loadIconStylesheet();
                observer.disconnect();
            },
            {
                rootMargin: lowPowerMode.matches ? "140px 0px" : "360px 0px"
            }
        );

        iconHosts.forEach((host) => observer.observe(host));
    }

    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((eventName) => {
        window.addEventListener(eventName, loadIconStylesheet, { once: true, passive: true });
    });

    observeDeferredImages();
    observeIconSections();
});
