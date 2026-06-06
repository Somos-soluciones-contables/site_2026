document.addEventListener("DOMContentLoaded", () => {
    const sliderSection = document.getElementById("carrusel");
    const sliderTrack = document.getElementById("clients-slide-track");
    const prevButton = document.getElementById("prev-slide-btn");
    const nextButton = document.getElementById("next-slide-btn");

    if (!sliderSection || !sliderTrack || !prevButton || !nextButton || !sliderTrack.children.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let autoSlideInterval = null;
    let isTransitioning = false;
    let isSliderVisible = false;
    let slideWidth = 0;

    function updateSlideWidth() {
        const firstSlide = sliderTrack.querySelector(".client-slide");

        if (!firstSlide) {
            slideWidth = 0;
            return;
        }

        const trackStyles = window.getComputedStyle(sliderTrack);
        const gap = Number.parseFloat(trackStyles.gap || trackStyles.columnGap || "0");
        slideWidth = firstSlide.offsetWidth + gap;
    }

    function resetTrackPosition() {
        sliderTrack.style.transition = "none";
        sliderTrack.style.transform = "translateX(0)";
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            window.clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    function shouldAutoSlide() {
        return !prefersReducedMotion.matches && !document.hidden && isSliderVisible;
    }

    function startAutoSlide() {
        stopAutoSlide();

        if (!shouldAutoSlide()) {
            return;
        }

        autoSlideInterval = window.setInterval(() => moveToNextSlide(), 2800);
    }

    function moveToPrevSlide() {
        if (isTransitioning || !slideWidth) {
            return;
        }

        const lastSlide = sliderTrack.lastElementChild;

        if (!lastSlide) {
            return;
        }

        isTransitioning = true;
        sliderTrack.insertBefore(lastSlide, sliderTrack.firstElementChild);
        sliderTrack.style.transition = "none";
        sliderTrack.style.transform = `translateX(-${slideWidth}px)`;

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                sliderTrack.style.transition = "transform 0.6s ease-in-out";
                sliderTrack.style.transform = "translateX(0)";
            });
        });

        sliderTrack.addEventListener(
            "transitionend",
            () => {
                isTransitioning = false;
            },
            { once: true }
        );
    }

    function moveToNextSlide() {
        if (isTransitioning || !slideWidth) {
            return;
        }

        isTransitioning = true;
        sliderTrack.style.transition = "transform 0.6s ease-in-out";
        sliderTrack.style.transform = `translateX(-${slideWidth}px)`;

        sliderTrack.addEventListener(
            "transitionend",
            () => {
                const firstSlide = sliderTrack.firstElementChild;

                sliderTrack.style.transition = "none";
                sliderTrack.style.transform = "translateX(0)";

                if (firstSlide) {
                    sliderTrack.appendChild(firstSlide);
                }

                isTransitioning = false;
            },
            { once: true }
        );
    }

    prevButton.addEventListener("click", () => {
        stopAutoSlide();
        moveToPrevSlide();
        startAutoSlide();
    });

    nextButton.addEventListener("click", () => {
        stopAutoSlide();
        moveToNextSlide();
        startAutoSlide();
    });

    sliderSection.addEventListener("mouseenter", stopAutoSlide);
    sliderSection.addEventListener("mouseleave", startAutoSlide);
    sliderSection.addEventListener("focusin", stopAutoSlide);
    sliderSection.addEventListener("focusout", startAutoSlide);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoSlide();
            return;
        }

        startAutoSlide();
    });

    if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(() => {
            updateSlideWidth();
            resetTrackPosition();
        });

        resizeObserver.observe(sliderTrack);
    } else {
        window.addEventListener("resize", () => {
            updateSlideWidth();
            resetTrackPosition();
        });
    }

    if ("IntersectionObserver" in window) {
        const visibilityObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isSliderVisible = entry.isIntersecting;

                    if (isSliderVisible) {
                        updateSlideWidth();
                        startAutoSlide();
                    } else {
                        stopAutoSlide();
                    }
                });
            },
            {
                rootMargin: "240px 0px",
                threshold: 0.2
            }
        );

        visibilityObserver.observe(sliderSection);
    } else {
        isSliderVisible = true;
        startAutoSlide();
    }

    if (typeof prefersReducedMotion.addEventListener === "function") {
        prefersReducedMotion.addEventListener("change", startAutoSlide);
    } else if (typeof prefersReducedMotion.addListener === "function") {
        prefersReducedMotion.addListener(startAutoSlide);
    }

    updateSlideWidth();
});
