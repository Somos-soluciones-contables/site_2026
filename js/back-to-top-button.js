const backToTop = document.getElementById('backToTop');
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (backToTop) {
    const backToTopButton = backToTop.querySelector(".back-to-top-button");
    let resetTimer = null;

    function clearResetState() {
        if (resetTimer) {
            window.clearTimeout(resetTimer);
            resetTimer = null;
        }

        backToTopButton?.classList.remove("is-resetting");
    }

    function scheduleResetStateRelease(delay = 380) {
        clearResetState();
        resetTimer = window.setTimeout(() => {
            backToTopButton?.classList.remove("is-resetting");
            resetTimer = null;
        }, delay);
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            if (!backToTop.classList.contains('show-back-to-top')) {
                backToTop.classList.add('show-back-to-top');
            }
        } else {
            if (backToTop.classList.contains('show-back-to-top')) {
                backToTop.classList.remove('show-back-to-top');
            }

            clearResetState();
        }
    }, { passive: true });

    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        backToTopButton?.classList.add("is-resetting");
        backToTopButton?.blur();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });

        scheduleResetStateRelease(prefersReducedMotion.matches ? 80 : 620);
    });
}
