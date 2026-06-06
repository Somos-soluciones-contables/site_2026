document.addEventListener("DOMContentLoaded", () => {
    const servicesVideo = document.querySelector(".services-video");

    if (!servicesVideo) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPowerVideoMode = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)");
    const isBraveBrowser = typeof navigator !== "undefined"
        && typeof navigator.brave === "object"
        && typeof navigator.brave?.isBrave === "function";
    let isVideoNearViewport = false;

    servicesVideo.preload = "metadata";
    servicesVideo.playsInline = true;
    servicesVideo.setAttribute("preload", "metadata");

    if (!prefersReducedMotion.matches && !lowPowerVideoMode.matches && !isBraveBrowser) {
        servicesVideo.load();
    }

    async function attemptPlayback() {
        if (prefersReducedMotion.matches) {
            servicesVideo.pause();
            return;
        }

        try {
            await servicesVideo.play();
        } catch (error) {
            servicesVideo.pause();
        }
    }

    function pausePlayback() {
        servicesVideo.pause();
    }

    if (!("IntersectionObserver" in window)) {
        attemptPlayback();
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                isVideoNearViewport = entry.isIntersecting;

                if (entry.isIntersecting) {
                    attemptPlayback();
                } else {
                    pausePlayback();
                }
            });
        },
        {
            rootMargin: "320px 0px",
            threshold: 0.18
        }
    );

    observer.observe(servicesVideo);

    const motionHandler = () => {
        if (prefersReducedMotion.matches) {
            pausePlayback();
            return;
        }

        if (!document.hidden && isVideoNearViewport) {
            attemptPlayback();
        }
    };

    if (typeof prefersReducedMotion.addEventListener === "function") {
        prefersReducedMotion.addEventListener("change", motionHandler);
    } else if (typeof prefersReducedMotion.addListener === "function") {
        prefersReducedMotion.addListener(motionHandler);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            pausePlayback();
            return;
        }

        if (isVideoNearViewport) {
            attemptPlayback();
        }
    });
});
