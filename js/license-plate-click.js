async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback below.
        }
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    helper.style.pointerEvents = "none";
    document.body.appendChild(helper);
    helper.select();

    let copied = false;

    try {
        copied = document.execCommand("copy");
    } catch (error) {
        copied = false;
    }

    helper.remove();
    return copied;
}

document.querySelectorAll(".plate-number").forEach((link) => {
    link.addEventListener("click", async (event) => {
        event.preventDefault();

        const plateNumber = link.textContent.replace(/-/g, "").trim();
        await copyToClipboard(plateNumber);

        window.open(link.href, "_blank", "noopener,noreferrer");
    });
});
