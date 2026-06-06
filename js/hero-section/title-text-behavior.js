const heroWords = [
    "Soluciones Contables.",
    "Asesoramiento personalizado.",
    "Estrategia y planificación.",
    "Crecimiento para tu empresa."
];

const textElement = document.getElementById("dynamic-text");
const typingElement = document.getElementById("typing");
const textContainer = document.getElementById("text-container");
const fixedElement = document.getElementById("fixed");
const heroTitleLockup = document.querySelector(".hero-title-lockup");
const prefersReducedHeroMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let heroWordIndex = 0;
let heroTimeouts = [];
let heroSequenceFinished = false;
const heroWordStateClasses = ["is-typing", "is-erasing", "is-resting"];
let heroMeasureNode = null;
let heroResizeHandle = null;

function clearHeroTimers() {
    heroTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    heroTimeouts = [];
}

function scheduleHeroTask(callback, delay) {
    const timeoutId = window.setTimeout(() => {
        heroTimeouts = heroTimeouts.filter((item) => item !== timeoutId);
        callback();
    }, delay);

    heroTimeouts.push(timeoutId);
}

if (textElement) {
    function getHeroMeasureNode() {
        if (heroMeasureNode) {
            return heroMeasureNode;
        }

        heroMeasureNode = document.createElement("span");
        heroMeasureNode.setAttribute("aria-hidden", "true");
        heroMeasureNode.style.position = "absolute";
        heroMeasureNode.style.visibility = "hidden";
        heroMeasureNode.style.pointerEvents = "none";
        heroMeasureNode.style.inset = "0 auto auto 0";
        heroMeasureNode.style.zIndex = "-1";
        heroMeasureNode.style.whiteSpace = "normal";
        heroMeasureNode.style.display = "inline-block";
        heroMeasureNode.style.opacity = "0";
        document.body.appendChild(heroMeasureNode);
        return heroMeasureNode;
    }

    function resetHeroReserveHeight() {
        if (!typingElement || !textContainer || !heroTitleLockup) {
            return;
        }

        typingElement.style.minHeight = "";
        textContainer.style.minHeight = "";
        textContainer.style.height = "";
        heroTitleLockup.style.minHeight = "";
        heroTitleLockup.style.height = "";
    }

    function syncHeroReserveHeight() {
        if (!typingElement || !textContainer || !fixedElement || !heroTitleLockup) {
            return;
        }

        if (window.innerWidth > 900) {
            resetHeroReserveHeight();
            return;
        }

        const measureNode = getHeroMeasureNode();
        const typingStyles = window.getComputedStyle(typingElement);
        const textContainerStyles = window.getComputedStyle(textContainer);
        const availableWidth = Math.max(
            typingElement.clientWidth,
            textContainer.clientWidth,
            Math.round(textContainer.getBoundingClientRect().width)
        );

        if (!availableWidth) {
            return;
        }

        measureNode.style.width = `${availableWidth}px`;
        measureNode.style.fontFamily = typingStyles.fontFamily;
        measureNode.style.fontSize = typingStyles.fontSize;
        measureNode.style.fontWeight = "700";
        measureNode.style.fontStyle = typingStyles.fontStyle;
        measureNode.style.letterSpacing = typingStyles.letterSpacing;
        measureNode.style.lineHeight = typingStyles.lineHeight;
        measureNode.style.textTransform = typingStyles.textTransform;
        measureNode.style.padding = typingStyles.padding;
        measureNode.style.borderRadius = typingStyles.borderRadius;
        measureNode.style.boxSizing = typingStyles.boxSizing;

        let measuredTextHeight = 0;

        heroWords.forEach((word) => {
            measureNode.textContent = word;
            measuredTextHeight = Math.max(measuredTextHeight, Math.ceil(measureNode.getBoundingClientRect().height));
        });

        const fixedHeight = Math.ceil(fixedElement.getBoundingClientRect().height);
        const blockGap = parseFloat(textContainerStyles.marginTop) || 0;
        const reserveHeight = Math.max(measuredTextHeight, 72);

        typingElement.style.minHeight = `${reserveHeight}px`;
        textContainer.style.minHeight = `${reserveHeight}px`;
        textContainer.style.height = "auto";
        heroTitleLockup.style.height = "auto";
        heroTitleLockup.style.minHeight = `${Math.ceil(fixedHeight + blockGap + reserveHeight)}px`;
    }

    function queueHeroReserveSync() {
        if (heroResizeHandle) {
            window.cancelAnimationFrame(heroResizeHandle);
        }

        heroResizeHandle = window.requestAnimationFrame(() => {
            heroResizeHandle = null;
            syncHeroReserveHeight();
        });
    }

    function setHeroWordState(state) {
        textElement.classList.remove(...heroWordStateClasses);

        if (state) {
            textElement.classList.add(state);
        }
    }

    function applyHeroWordStyle(word) {
        textElement.style.color = "#FFD0F0";
        textElement.style.fontWeight = word === "Soluciones Contables." ? "700" : "600";
    }

    function getTypeDelay(word, characterIndex) {
        const character = word[characterIndex];

        if (character === " ") {
            return 34;
        }

        if (/[.,]/.test(character)) {
            return 92;
        }

        return characterIndex < 3 ? 52 : 44;
    }

    function getEraseDelay(word, characterIndex) {
        const character = word[characterIndex - 1];

        if (character === " ") {
            return 18;
        }

        if (/[.,]/.test(character)) {
            return 26;
        }

        return 20;
    }

    function typeEffect(word, callback, shouldErase = true) {
        let letterIndex = 0;
        textElement.textContent = "";
        applyHeroWordStyle(word);
        setHeroWordState("is-typing");

        function typeLetter() {
            if (letterIndex < word.length) {
                textElement.textContent = word.slice(0, letterIndex + 1);
                letterIndex += 1;
                scheduleHeroTask(typeLetter, getTypeDelay(word, letterIndex - 1));
            } else {
                setHeroWordState("is-resting");

                if (!shouldErase) {
                    heroSequenceFinished = true;

                    if (typeof callback === "function") {
                        scheduleHeroTask(callback, word === "Soluciones Contables." ? 2150 : 1350);
                    }

                    return;
                }

                scheduleHeroTask(() => eraseEffect(callback), word === "Soluciones Contables." ? 2150 : 1350);
            }
        }

        scheduleHeroTask(typeLetter, 60);
    }

    function eraseEffect(callback) {
        const currentWord = textElement.textContent;
        let letterIndex = currentWord.length;
        setHeroWordState("is-erasing");

        function eraseLetter() {
            if (letterIndex > 0) {
                letterIndex -= 1;
                textElement.textContent = currentWord.substring(0, letterIndex);
                scheduleHeroTask(eraseLetter, getEraseDelay(currentWord, letterIndex + 1));
            } else {
                scheduleHeroTask(() => {
                    setHeroWordState("is-typing");
                    callback();
                }, 140);
            }
        }

        scheduleHeroTask(eraseLetter, 70);
    }

    function finishHeroSequence() {
        typeEffect(heroWords[0], null, false);
    }

    function cycleText() {
        if (heroSequenceFinished) {
            return;
        }

        const currentWord = heroWords[heroWordIndex];
        const isLastConnector = heroWordIndex === heroWords.length - 1;

        typeEffect(currentWord, () => {
            if (isLastConnector) {
                eraseEffect(finishHeroSequence);
                return;
            }

            heroWordIndex += 1;
            cycleText();
        });
    }

    function syncHeroMotion() {
        clearHeroTimers();
        heroSequenceFinished = false;
        queueHeroReserveSync();

        if (prefersReducedHeroMotion.matches) {
            const firstWord = heroWords[0];
            applyHeroWordStyle(firstWord);
            textElement.textContent = firstWord;
            setHeroWordState("is-resting");
            return;
        }

        heroWordIndex = 0;
        cycleText();
    }

    syncHeroMotion();
    window.addEventListener("resize", queueHeroReserveSync, { passive: true });

    if (document.fonts?.ready) {
        document.fonts.ready.then(queueHeroReserveSync).catch(() => {});
    }

    if (typeof prefersReducedHeroMotion.addEventListener === "function") {
        prefersReducedHeroMotion.addEventListener("change", syncHeroMotion);
    } else if (typeof prefersReducedHeroMotion.addListener === "function") {
        prefersReducedHeroMotion.addListener(syncHeroMotion);
    }
}
