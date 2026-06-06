document.addEventListener("DOMContentLoaded", () => {
    const heroCarousel = document.querySelector(".hero-swiper");

    if (!heroCarousel) {
        return;
    }

    const slides = Array.from(heroCarousel.querySelectorAll(".swiper-slide"));
    const pagination = heroCarousel.querySelector(".swiper-pagination");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPowerCarouselMode = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)");
    const isBraveBrowser = typeof navigator !== "undefined"
        && typeof navigator.brave === "object"
        && typeof navigator.brave?.isBrave === "function";
    const autoplayDelay = 3600;
    let activeIndex = 0;
    let autoplayTimer = null;

    if (!slides.length) {
        return;
    }

    function getSlideImage(index) {
        return slides[index]?.querySelector("img") ?? null;
    }

    function ensureSlideImage(index) {
        const image = getSlideImage(index);

        if (!image || image.getAttribute("src")) {
            return;
        }

        const pendingSrc = image.dataset.src;

        if (!pendingSrc) {
            return;
        }

        image.src = pendingSrc;
        image.removeAttribute("data-src");
    }

    function warmAdjacentSlides(index) {
        ensureSlideImage(index);
        ensureSlideImage((index + 1) % slides.length);

        if (!lowPowerCarouselMode.matches && !isBraveBrowser) {
            ensureSlideImage((index - 1 + slides.length) % slides.length);
        }
    }

    function buildPagination() {
        if (!pagination) {
            return [];
        }

        pagination.innerHTML = "";

        return slides.map((_, index) => {
            const bullet = document.createElement("button");
            bullet.type = "button";
            bullet.className = "swiper-pagination-bullet";
            bullet.setAttribute("aria-label", `Ver imagen ${index + 1}`);
            bullet.setAttribute("aria-pressed", "false");
            bullet.addEventListener("click", () => {
                goToSlide(index);
                restartAutoplay();
            });
            pagination.appendChild(bullet);
            return bullet;
        });
    }

    const bullets = buildPagination();

    function renderSlide(index) {
        activeIndex = index;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === index;
            slide.classList.toggle("is-active", isActive);
            slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        });

        bullets.forEach((bullet, bulletIndex) => {
            const isActive = bulletIndex === index;
            bullet.classList.toggle("swiper-pagination-bullet-active", isActive);
            bullet.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        warmAdjacentSlides(index);
    }

    function clearAutoplay() {
        if (autoplayTimer) {
            window.clearTimeout(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function scheduleAutoplay() {
        clearAutoplay();

        if (prefersReducedMotion.matches || slides.length < 2 || document.hidden) {
            return;
        }

        autoplayTimer = window.setTimeout(() => {
            goToSlide((activeIndex + 1) % slides.length, false);
        }, autoplayDelay);
    }

    function restartAutoplay() {
        scheduleAutoplay();
    }

    function goToSlide(index, shouldRestart = true) {
        if (index === activeIndex) {
            if (shouldRestart) {
                restartAutoplay();
            }
            return;
        }

        renderSlide(index);

        if (shouldRestart) {
            restartAutoplay();
        } else {
            scheduleAutoplay();
        }
    }

    ensureSlideImage(0);
    heroCarousel.classList.add("is-ready");
    renderSlide(0);
    scheduleAutoplay();

    heroCarousel.addEventListener("mouseenter", clearAutoplay);
    heroCarousel.addEventListener("mouseleave", scheduleAutoplay);
    heroCarousel.addEventListener("focusin", clearAutoplay);
    heroCarousel.addEventListener("focusout", scheduleAutoplay);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearAutoplay();
            return;
        }

        scheduleAutoplay();
    });

    const motionHandler = () => scheduleAutoplay();

    if (typeof prefersReducedMotion.addEventListener === "function") {
        prefersReducedMotion.addEventListener("change", motionHandler);
    } else if (typeof prefersReducedMotion.addListener === "function") {
        prefersReducedMotion.addListener(motionHandler);
    }
});
