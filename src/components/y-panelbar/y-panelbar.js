export class YumePanelBar extends HTMLElement {

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
            }
        `);

        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.innerHTML = `
            <slot></slot>
        `;
    }
}

if (!customElements.get("y-panelbar")) {
    customElements.define("y-panelbar", YumePanelBar);
}
