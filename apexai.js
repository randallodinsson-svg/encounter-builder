// APEXAI — lightweight echo/transform console

export const APEXAI = (() => {
    let core = null;
    let ui = null;

    function init(coreRef, uiRefs) {
        core = coreRef;
        ui = uiRefs;
        ui.sendBtn.addEventListener("click", onSend);
    }

    function onSend() {
        const text = ui.inputEl.value.trim();
        if (!text) return;
        const ts = new Date().toISOString();
        const response = `[${ts}] APEXAI processed:\n${text}\n\n(Stubbed local AI console)`;
        ui.outputEl.textContent += "\n\n" + response;
        ui.inputEl.value = "";
        core.set("ai.lastPrompt", text);
        core.set("ai.lastResponse", response);
    }

    return {
        init
    };
})();
