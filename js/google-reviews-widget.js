document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-google-reviews-widget]").forEach(setupGoogleReviewsWidget);
});

function setupGoogleReviewsWidget(root) {
    const track = root.querySelector("[data-google-reviews-track]");
    const viewport = root.querySelector("[data-google-reviews-viewport]");
    const dots = root.querySelector("[data-google-reviews-dots]");
    const prevButton = root.querySelector("[data-google-prev]");
    const nextButton = root.querySelector("[data-google-next]");
    const ratingValue = root.querySelector("[data-google-rating]");
    const fiveStarValue = root.querySelector("[data-google-five-star]");
    const totalValue = root.querySelector("[data-google-total]");
    const profileLink = root.querySelector("[data-google-profile-link]");
    const note = root.querySelector("[data-google-widget-note]");
    let reviewModal = null;
    let hasFetchedRemoteReviews = false;
    let autoplayTimer = null;
    const autoplayDelay = 5200;

    if (!track || !viewport || !dots || !prevButton || !nextButton) {
        return;
    }

    const fallbackReviews = Array.from(track.querySelectorAll("[data-google-review]"))
        .map((card) => ({
            authorName: card.dataset.author?.trim() || "",
            dateLabel: card.dataset.date?.trim() || "",
            rating: normalizeRating(card.dataset.rating || 0),
            text: card.querySelector(".google-review-text")?.textContent?.trim() || "",
            initials: card.dataset.initials?.trim() || "",
            authorPhotoUrl: "",
            reviewUrl: card.dataset.reviewUrl || "#"
        }))
        .filter((review) => review.authorName || review.text);

    let currentIndex = 0;

    if (profileLink && root.dataset.profileUrl?.trim()) {
        profileLink.href = sanitizeUrl(root.dataset.profileUrl.trim()) || "#";
    }

    function getReviewModal() {
        if (!reviewModal) {
            reviewModal = ensureGoogleReviewModal();
        }

        return reviewModal;
    }

    function getSlides() {
        return Array.from(track.querySelectorAll("[data-google-review]"));
    }

    function getGap() {
        const styles = window.getComputedStyle(track);
        return parseFloat(styles.columnGap || styles.gap || "0") || 0;
    }

    function buildDots() {
        const slides = getSlides();
        dots.innerHTML = "";

        slides.forEach((_, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "google-reviews-dot";
            dot.setAttribute("aria-label", `Ir a la resena ${index + 1}`);
            dot.addEventListener("click", () => {
                currentIndex = index;
                syncSlider();
                restartAutoplay();
            });
            dots.appendChild(dot);
        });
    }

    function syncStats(summary, sourceReviews) {
        const normalizedReviews = sourceReviews.length ? sourceReviews : fallbackReviews;
        const numericRatings = normalizedReviews
            .map((review) => normalizeRating(review.rating))
            .filter((value) => Number.isFinite(value) && value > 0);

        const computedAverage = numericRatings.length
            ? numericRatings.reduce((sum, value) => sum + value, 0) / numericRatings.length
            : 0;

        const average = Number.isFinite(summary.rating) ? summary.rating : computedAverage;
        const total = Number.isFinite(summary.totalReviews) ? summary.totalReviews : normalizedReviews.length;
        const fiveStar = Number.isFinite(summary.fiveStarReviews)
            ? summary.fiveStarReviews
            : normalizedReviews.filter((review) => normalizeRating(review.rating) >= 5).length;

        if (ratingValue) {
            ratingValue.textContent = average.toFixed(1);
        }

        if (fiveStarValue) {
            fiveStarValue.textContent = String(fiveStar);
        }

        if (totalValue) {
            totalValue.textContent = String(total);
        }
    }

    function syncSlider() {
        const slides = getSlides();

        if (!slides.length) {
            track.style.transform = "translate3d(0, 0, 0)";
            return;
        }

        currentIndex = ((currentIndex % slides.length) + slides.length) % slides.length;

        const viewportWidth = viewport.getBoundingClientRect().width || slides[0].getBoundingClientRect().width;
        const slideWidth = viewportWidth + getGap();
        track.style.transform = `translate3d(${-currentIndex * slideWidth}px, 0, 0)`;

        Array.from(dots.children).forEach((dot, index) => {
            dot.classList.toggle("is-active", index === currentIndex);
        });
    }

    function syncReadMoreButtons() {
        getSlides().forEach((card) => {
            const text = card.querySelector(".google-review-text");
            const button = card.querySelector("[data-google-review-more]");

            if (!text || !button) {
                return;
            }

            const isOverflowing = text.scrollHeight - text.clientHeight > 2 || text.scrollWidth - text.clientWidth > 2;
            button.hidden = !isOverflowing;
            card.classList.toggle("has-review-more", isOverflowing);
        });
    }

    function syncLayout() {
        syncSlider();
        requestAnimationFrame(syncReadMoreButtons);
    }

    function move(direction) {
        const slides = getSlides();

        if (!slides.length) {
            return;
        }

        currentIndex += direction;
        syncSlider();
        restartAutoplay();
    }

    function clearAutoplay() {
        if (autoplayTimer) {
            window.clearTimeout(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function scheduleAutoplay() {
        clearAutoplay();

        const slides = getSlides();

        if (slides.length < 2 || document.hidden) {
            return;
        }

        autoplayTimer = window.setTimeout(() => {
            currentIndex += 1;
            syncSlider();
            scheduleAutoplay();
        }, autoplayDelay);
    }

    function restartAutoplay() {
        scheduleAutoplay();
    }

    function renderReviews(sourceReviews) {
        if (!sourceReviews.length) {
            track.innerHTML = "";
            buildDots();
            currentIndex = 0;
            syncLayout();
            return;
        }

        track.innerHTML = sourceReviews.map(renderReviewCard).join("");
        buildDots();
        currentIndex = 0;
        syncLayout();
        requestAnimationFrame(() => {
            currentIndex = 0;
            syncSlider();
            restartAutoplay();
        });
    }

    function renderReviewCard(review) {
        const authorName = escapeHtml(review.authorName || "Cliente");
        const dateLabel = escapeHtml(review.dateLabel || "Google");
        const text = escapeHtml(review.text || "");
        const reviewUrl = escapeHtml(sanitizeUrl(review.reviewUrl) || "#");
        const rating = Math.max(1, Math.min(5, normalizeRating(review.rating) || 5));
        const initials = escapeHtml(review.initials || buildInitials(review.authorName || "GC"));
        const starsLabel = `${rating} de 5 estrellas`;
        const authorPhotoUrl = sanitizeUrl(review.authorPhotoUrl);
        const photoMarkup = authorPhotoUrl
            ? `<img src="${escapeHtml(authorPhotoUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
            : initials;

        return `
            <article class="google-review-card" data-google-review data-rating="${rating}" data-author="${authorName}" data-date="${dateLabel}" data-review-url="${reviewUrl}">
                <div class="google-review-card-top">
                    <div class="google-review-author">
                        <span class="google-review-avatar">${photoMarkup}</span>
                        <div class="google-review-author-copy">
                            <strong>${authorName}</strong>
                            <span>${dateLabel}</span>
                        </div>
                    </div>
                    <span class="google-review-mark" aria-hidden="true"><i class="fa-brands fa-google"></i></span>
                </div>
                <p class="google-review-stars" aria-label="${starsLabel}">${new Array(rating).fill("&#9733;").join("")}</p>
                <p class="google-review-text">${text}</p>
                <button type="button" class="google-review-more" data-google-review-more hidden>Leer mas</button>
                <span class="google-review-accent" aria-hidden="true"></span>
            </article>
        `;
    }

    prevButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));
    track.addEventListener("click", (event) => {
        const button = event.target.closest("[data-google-review-more]");

        if (!button) {
            return;
        }

        const card = button.closest("[data-google-review]");

        if (!card) {
            return;
        }

        openGoogleReviewModal(getReviewModal(), {
            authorName: card.dataset.author || "Cliente",
            dateLabel: card.dataset.date || "",
            rating: card.dataset.rating || 5,
            text: card.querySelector(".google-review-text")?.textContent?.trim() || "",
            reviewUrl: card.dataset.reviewUrl || profileLink?.href || root.dataset.profileUrl || "#"
        });
    });
    window.addEventListener("resize", syncLayout);
    viewport.addEventListener("mouseenter", clearAutoplay);
    viewport.addEventListener("mouseleave", restartAutoplay);
    viewport.addEventListener("focusin", clearAutoplay);
    viewport.addEventListener("focusout", restartAutoplay);

    buildDots();
    syncStats({}, fallbackReviews);
    syncLayout();
    restartAutoplay();

    const endpoint = root.dataset.endpoint?.trim();

    if (!endpoint) {
        return;
    }

    function fetchRemoteReviews() {
        if (hasFetchedRemoteReviews) {
            return;
        }

        hasFetchedRemoteReviews = true;

        fetch(endpoint, {
            headers: {
                Accept: "application/json"
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return response.json();
            })
            .then((payload) => {
                const normalized = normalizePayload(payload, root.dataset.profileUrl || "");

                if (normalized.isPlaceholder) {
                    if (profileLink && normalized.profileUrl) {
                        profileLink.href = sanitizeUrl(normalized.profileUrl) || "#";
                    }

                    renderReviews([]);
                    syncStats({ rating: 0, totalReviews: 0, fiveStarReviews: 0 }, []);

                    if (note) {
                        note.textContent = "";
                    }

                    return;
                }

                if (normalized.reviews.length) {
                    renderReviews(normalized.reviews);
                }

                syncStats(normalized, normalized.reviews);

                if (profileLink && normalized.profileUrl) {
                    profileLink.href = sanitizeUrl(normalized.profileUrl) || "#";
                }

                if (note) {
                    note.textContent = "";
                }
            })
            .catch(() => {
                if (note) {
                    note.textContent = "";
                }
            });
    }

    if (!("IntersectionObserver" in window)) {
        fetchRemoteReviews();
        return;
    }

    const remoteDataObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                fetchRemoteReviews();
                remoteDataObserver.disconnect();
            });
        },
        {
            rootMargin: "280px 0px"
        }
    );

    remoteDataObserver.observe(root);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearAutoplay();
            return;
        }

        restartAutoplay();
    });
}

function normalizePayload(payload, fallbackProfileUrl) {
    const source = Array.isArray(payload)
        ? { reviews: payload }
        : payload || {};

    if (source.isPlaceholder) {
        return {
            generatedAt: source.generatedAt || source.updatedAt || source.syncedAt || "",
            isPlaceholder: true,
            rating: 0,
            totalReviews: 0,
            fiveStarReviews: 0,
            profileUrl: source.profileUrl || source.googleMapsUri || source.result?.googleMapsUri || fallbackProfileUrl,
            reviews: []
        };
    }

    const reviews = (source.reviews || source.result?.reviews || source.reviewList?.reviews || [])
        .map(normalizeReview)
        .filter((review) => review.text);

    return {
        generatedAt: source.generatedAt || source.updatedAt || source.syncedAt || "",
        isPlaceholder: Boolean(source.isPlaceholder),
        rating: readNumeric(source.rating) ?? readNumeric(source.averageRating) ?? readNumeric(source.result?.rating),
        totalReviews: readNumeric(source.totalReviews) ?? readNumeric(source.totalReviewCount) ?? readNumeric(source.userRatingCount) ?? readNumeric(source.result?.userRatingCount),
        fiveStarReviews: readNumeric(source.fiveStarReviews),
        profileUrl: source.profileUrl || source.googleMapsUri || source.result?.googleMapsUri || fallbackProfileUrl,
        reviews
    };
}

function normalizeReview(review) {
    const authorName = review.authorName
        || review.author_name
        || review.authorAttribution?.displayName
        || review.reviewer?.displayName
        || review.author
        || "Cliente";
    const rating = normalizeRating(review.rating || review.starRating || review.stars || 5);
    const text = (review.text?.text || review.comment || review.originalText?.text || review.text || "").trim();

    return {
        authorName,
        initials: buildInitials(authorName),
        rating,
        text,
        dateLabel: review.relativeTimeDescription
            || review.relativePublishTimeDescription
            || formatDateLabel(review.publishTime || review.createTime || review.updateTime || review.reviewTime),
        authorPhotoUrl: review.authorPhotoUrl
            || review.author_photo_url
            || review.authorAttribution?.photoUri
            || review.reviewer?.profilePhotoUrl
            || "",
        reviewUrl: review.reviewUrl
            || review.authorAttribution?.uri
            || review.reviewer?.profileUrl
            || "#"
    };
}

function ensureGoogleReviewModal() {
    let modal = document.querySelector("[data-google-review-modal]");

    if (modal) {
        return modal;
    }

    modal = document.createElement("div");
    modal.className = "google-review-modal";
    modal.hidden = true;
    modal.setAttribute("data-google-review-modal", "");
    modal.innerHTML = `
        <div class="google-review-modal-backdrop" data-google-review-close></div>
        <div class="google-review-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="googleReviewModalTitle">
            <button type="button" class="google-review-modal-close" data-google-review-close aria-label="Cerrar resena">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
            <div class="google-review-modal-head">
                <p class="google-review-modal-stars" data-google-review-modal-stars aria-label="Calificacion de la resena"></p>
                <h4 id="googleReviewModalTitle" data-google-review-modal-author></h4>
                <p class="google-review-modal-date" data-google-review-modal-date></p>
            </div>
            <p class="google-review-modal-text" data-google-review-modal-text></p>
            <div class="google-review-modal-actions">
                <a href="#" class="google-review-modal-link" data-google-review-modal-link target="_blank" rel="noopener noreferrer">Ver en Google</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeTriggers = modal.querySelectorAll("[data-google-review-close]");
    let lastFocusedElement = null;

    function closeModal() {
        modal.classList.remove("is-open");
        document.body.classList.remove("google-review-modal-open");

        window.setTimeout(() => {
            modal.hidden = true;
            if (lastFocusedElement instanceof HTMLElement) {
                lastFocusedElement.focus();
            }
        }, 180);
    }

    closeTriggers.forEach((trigger) => {
        trigger.addEventListener("click", closeModal);
    });

    function getFocusableElements() {
        return Array.from(modal.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"))
            .filter((element) => !element.hidden && element.offsetParent !== null);
    }

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!modal.classList.contains("is-open")) {
            return;
        }

        if (event.key === "Escape") {
            closeModal();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
            event.preventDefault();
            return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            return;
        }

        if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });

    modal.openReview = (review) => {
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const author = modal.querySelector("[data-google-review-modal-author]");
        const date = modal.querySelector("[data-google-review-modal-date]");
        const stars = modal.querySelector("[data-google-review-modal-stars]");
        const text = modal.querySelector("[data-google-review-modal-text]");
        const link = modal.querySelector("[data-google-review-modal-link]");
        const normalizedRating = Math.max(1, Math.min(5, normalizeRating(review.rating) || 5));
        const reviewUrl = sanitizeUrl(review.reviewUrl);

        if (author) {
            author.textContent = review.authorName || "Cliente";
        }

        if (date) {
            date.textContent = review.dateLabel || "";
        }

        if (stars) {
            stars.textContent = new Array(normalizedRating).fill("\u2605").join("");
            stars.setAttribute("aria-label", `${normalizedRating} de 5 estrellas`);
        }

        if (text) {
            text.textContent = review.text || "";
        }

        if (link) {
            if (reviewUrl) {
                link.href = reviewUrl;
                link.hidden = false;
            } else {
                link.hidden = true;
            }
        }

        modal.hidden = false;
        document.body.classList.add("google-review-modal-open");
        requestAnimationFrame(() => {
            modal.classList.add("is-open");
            modal.querySelector(".google-review-modal-close")?.focus();
        });
    };

    return modal;
}

function openGoogleReviewModal(modal, review) {
    if (!modal || typeof modal.openReview !== "function") {
        return;
    }

    modal.openReview(review);
}

function sanitizeUrl(value) {
    if (!value || value === "#") {
        return "";
    }

    try {
        const parsed = new URL(value, window.location.href);

        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.href;
        }
    } catch (error) {
        return "";
    }

    return "";
}

function normalizeRating(value) {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string") {
        const direct = Number.parseFloat(value);

        if (Number.isFinite(direct)) {
            return direct;
        }

        const enumMap = {
            ONE: 1,
            TWO: 2,
            THREE: 3,
            FOUR: 4,
            FIVE: 5,
            ONE_STAR: 1,
            TWO_STARS: 2,
            THREE_STARS: 3,
            FOUR_STARS: 4,
            FIVE_STARS: 5
        };

        return enumMap[value.toUpperCase()] || 5;
    }

    return 5;
}

function readNumeric(value) {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function buildInitials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "GC";
}

function formatDateLabel(value) {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return parsed.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "short"
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

