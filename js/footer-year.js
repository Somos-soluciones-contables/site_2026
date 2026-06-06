document.addEventListener("DOMContentLoaded", () => {
    const yearTarget = document.getElementById("currentYear");

    if (!yearTarget) {
        return;
    }

    yearTarget.textContent = String(new Date().getFullYear());
});
