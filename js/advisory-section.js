const advisoryGrid = document.querySelector(".advisory-grid");
const advisoryCards = Array.from(document.querySelectorAll(".advisory-card"));
const serviceStoryCopy = document.querySelector(".service-story-copy");
const pillarCards = Array.from(document.querySelectorAll(".pillar-card"));

if (advisoryGrid && advisoryCards.length) {
    const advisoryTouchMode = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)");
    const advisoryLiteMotion = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 760px)");
    const advisoryMediaNodes = advisoryCards
        .map((card) => card.querySelector(".advisory-media"))
        .filter(Boolean);
    let peekObserver = null;
    let advisoryMediaObserver = null;
    const scrollPeekTargets = [...pillarCards, ...advisoryCards].filter(Boolean);
    const peekRoot = advisoryGrid.closest(".services-section") || serviceStoryCopy || advisoryGrid;
    let peekTimers = [];
    let hasPeekedInTouchMode = false;

    function loadAdvisoryMedia(media) {
        const pendingImage = media?.dataset.advisoryImage;

        if (!media || !pendingImage) {
            return;
        }

        media.style.backgroundImage = `url("${pendingImage}")`;
        media.removeAttribute("data-advisory-image");
    }

    function hydrateAdvisoryMedia() {
        advisoryMediaNodes.forEach(loadAdvisoryMedia);
    }

    function disconnectAdvisoryMediaObserver() {
        if (advisoryMediaObserver) {
            advisoryMediaObserver.disconnect();
            advisoryMediaObserver = null;
        }
    }

    function setupAdvisoryMediaObserver() {
        disconnectAdvisoryMediaObserver();

        const pendingMedia = advisoryMediaNodes.filter((media) => media.dataset.advisoryImage);

        if (!pendingMedia.length) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            hydrateAdvisoryMedia();
            return;
        }

        advisoryMediaObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    hydrateAdvisoryMedia();
                    disconnectAdvisoryMediaObserver();
                });
            },
            {
                rootMargin: "260px 0px"
            }
        );

        advisoryMediaObserver.observe(peekRoot);
    }

    function setActiveAdvisoryCard(activeCard) {
        advisoryCards.forEach((card) => {
            const isActive = card === activeCard;
            card.classList.toggle("is-active", isActive);
            card.setAttribute("aria-expanded", isActive ? "true" : "false");
        });

        advisoryGrid.classList.toggle("has-active-advisory", Boolean(activeCard));
    }

    function clearActiveAdvisoryCards() {
        advisoryCards.forEach((card) => {
            card.classList.remove("is-active");
            card.setAttribute("aria-expanded", "false");
        });

        advisoryGrid.classList.remove("has-active-advisory");
    }

    function clearPeekedState() {
        scrollPeekTargets.forEach((target) => target.classList.remove("is-peeked"));
    }

    function clearPeekTimers() {
        peekTimers.forEach((timeoutId) => window.clearTimeout(timeoutId));
        peekTimers = [];
    }

    function disconnectPeekObserver() {
        if (peekObserver) {
            peekObserver.disconnect();
            peekObserver = null;
        }
    }

    function triggerPeekSequence() {
        clearPeekTimers();
        clearPeekedState();

        const peekTargets = advisoryLiteMotion.matches
            ? advisoryCards.slice(0, Math.min(2, advisoryCards.length))
            : scrollPeekTargets;
        const staggerDelay = advisoryLiteMotion.matches ? 72 : 90;
        const releaseDelay = advisoryLiteMotion.matches ? 560 : 760;

        peekTargets.forEach((target, index) => {
            const activateId = window.setTimeout(() => {
                target.classList.add("is-peeked");
            }, index * staggerDelay);

            const releaseId = window.setTimeout(() => {
                target.classList.remove("is-peeked");
            }, releaseDelay + index * staggerDelay);

            peekTimers.push(activateId, releaseId);
        });

        hasPeekedInTouchMode = true;
    }

    function setupPeekObserver() {
        clearPeekTimers();
        disconnectPeekObserver();

        if (!advisoryTouchMode.matches) {
            hasPeekedInTouchMode = false;
            clearPeekedState();
            return;
        }

        if (hasPeekedInTouchMode) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            triggerPeekSequence();
            return;
        }

        peekObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    triggerPeekSequence();
                    disconnectPeekObserver();
                });
            },
            {
                threshold: 0.16,
                rootMargin: "18% 0px -12% 0px"
            }
        );

        if (peekRoot) {
            peekObserver.observe(peekRoot);
        }
    }

    function syncAdvisoryInteractionMode() {
        if (advisoryTouchMode.matches) {
            const activeCard = advisoryCards.find((card) => card.classList.contains("is-active"));
            setActiveAdvisoryCard(activeCard || null);
        } else {
            clearActiveAdvisoryCards();
        }

        setupPeekObserver();
        setupAdvisoryMediaObserver();
    }

    advisoryCards.forEach((card) => {
        card.addEventListener("click", () => {
            loadAdvisoryMedia(card.querySelector(".advisory-media"));

            if (!advisoryTouchMode.matches) {
                return;
            }

            if (card.classList.contains("is-active")) {
                clearActiveAdvisoryCards();
                return;
            }

            setActiveAdvisoryCard(card);
        });

        card.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();

            if (advisoryTouchMode.matches) {
                if (card.classList.contains("is-active")) {
                    clearActiveAdvisoryCards();
                } else {
                    setActiveAdvisoryCard(card);
                }

                return;
            }

            card.classList.add("is-active");
            card.setAttribute("aria-expanded", "true");
            advisoryGrid.classList.add("has-active-advisory");

            window.setTimeout(() => {
                card.classList.remove("is-active");
                card.setAttribute("aria-expanded", "false");
                advisoryGrid.classList.remove("has-active-advisory");
            }, 600);
        });

        card.addEventListener("focus", () => {
            loadAdvisoryMedia(card.querySelector(".advisory-media"));

            if (!advisoryTouchMode.matches) {
                advisoryGrid.classList.add("has-active-advisory");
                card.setAttribute("aria-expanded", "true");
            }
        });

        card.addEventListener("blur", () => {
            if (!advisoryTouchMode.matches) {
                card.classList.remove("is-active");
                card.setAttribute("aria-expanded", "false");
                advisoryGrid.classList.remove("has-active-advisory");
            }
        });

        card.addEventListener("mouseenter", () => {
            loadAdvisoryMedia(card.querySelector(".advisory-media"));

            if (!advisoryTouchMode.matches) {
                advisoryGrid.classList.add("has-active-advisory");
            }
        });

        card.addEventListener("mouseleave", () => {
            if (!advisoryTouchMode.matches) {
                advisoryGrid.classList.remove("has-active-advisory");
            }
        });
    });

    syncAdvisoryInteractionMode();

    if (typeof advisoryTouchMode.addEventListener === "function") {
        advisoryTouchMode.addEventListener("change", syncAdvisoryInteractionMode);
    } else if (typeof advisoryTouchMode.addListener === "function") {
        advisoryTouchMode.addListener(syncAdvisoryInteractionMode);
    }
}
