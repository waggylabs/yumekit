/**
 * Auto-inject styles/variables.css into the document <head> so that
 * all YumeKit CSS custom-properties are available globally — even when
 * components are used without a <y-theme> wrapper.
 *
 * The `:root` variables defined in variables.css inherit through shadow-DOM
 * boundaries, so every web-component can resolve its `var(--*)` references.
 *
 * This module is idempotent: the stylesheet is only injected once regardless
 * of how many components import it.
 */

const LINK_ID = "yumekit-default-variables";

let injected = false;

export function loadDefaultVariables() {
    if (injected || typeof document === "undefined") return;

    // Guard against duplicate injection (e.g. both ESM + IIFE bundles loaded)
    if (document.getElementById(LINK_ID)) {
        injected = true;
        return;
    }

    // Resolve the URL relative to the importing script's location.
    // import.meta.url points to this module file (e.g. src/modules/ or dist/modules/).
    // Walk up to the package root, then into styles/.
    let baseUrl = document.currentScript?.src || import.meta.url;

    // Go up two levels: modules/ → src|dist/ → package root
    const base = new URL("../../", baseUrl).href;
    const stylesUrl = new URL("styles/variables.css", base).href;

    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = stylesUrl;
    document.head.appendChild(link);

    injected = true;
}

// Self-execute on import so components get defaults automatically
loadDefaultVariables();
