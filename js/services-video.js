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
    let hasHydratedVideo = false;

    servicesVideo.preload = "none";
    servicesVideo.playsInline = true;
    servicesVideo.setAttribute("preload", "none");

    function hydrateVideo() {
        if (hasHydratedVideo) {
            return;
        }

        hasHydratedVideo = true;

        if (servicesVideo.dataset.poster) {
            servicesVideo.poster = servicesVideo.dataset.poster;
            servicesVideo.removeAttribute("data-poster");
        }

        const pendingSource = servicesVideo.dataset.videoSrc;

        if (pendingSource) {
            const source = document.createElement("source");
            source.src = pendingSource;
            source.type = "video/mp4";
            servicesVideo.appendChild(source);
            servicesVideo.removeAttribute("data-video-src");
        }

        servicesVideo.preload = lowPowerVideoMode.matches || isBraveBrowser ? "metadata" : "auto";
        servicesVideo.setAttribute("preload", servicesVideo.preload);
        servicesVideo.load();
    }

    async function attemptPlayback() {
        if (prefersReducedMotion.matches) {
            servicesVideo.pause();
            return;
        }

        hydrateVideo();

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
            rootMargin: lowPowerVideoMode.matches ? "80px 0px" : "260px 0px",
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
