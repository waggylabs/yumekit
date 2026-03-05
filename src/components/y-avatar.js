export class YumeAvatar extends HTMLElement {
    static get observedAttributes() {
        return ["src", "alt", "size", "shape", "color"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const src = this.getAttribute("src");
        const altRaw = this.getAttribute("alt") || "AN";
        const shape = this.getAttribute("shape") || "circle";
        const color = this.getAttribute("color") || "primary";
        const borderRadius = `var(--component-avatar-border-radius-${shape}, 9999px)`;
        const [bgColor, textColor] = this._getColorVars(color);

        let dimensions;
        const size = this.getAttribute("size") || "medium";

        switch (size) {
            case "small":
                dimensions = "var(--component-avatar-size-small, 27px)";
                break;
            case "large":
                dimensions = "var(--component-avatar-size-large, 51px)";
                break;
            case "medium":
            default:
                dimensions = "var(--component-avatar-size-medium, 35px)";
                break;
        }

        const componentSheet = new CSSStyleSheet();
        let componentStyles = "";

        if (src) {
            componentStyles = `
          :host {
            display: inline-block;
            height: ${dimensions};
            min-width: ${dimensions};
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: ${borderRadius};
          }
        `;
        } else {
            componentStyles = `
          :host {
            display: inline-block;
            width: ${dimensions};
            height: ${dimensions};
            min-width: ${dimensions};
            font-family: var(--font-family-header, "Lexend"), sans-serif;
            text-transform: uppercase;
          }
          .avatar {
            width: 100%;
            height: 100%;
            border-radius: ${borderRadius};
            background-color: ${bgColor};
            color: ${textColor};
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .avatar h5 {
            margin: 0;
            font-size: calc(${dimensions} * 0.5);
          }
        `;
        }

        componentSheet.replaceSync(componentStyles);
        this.shadowRoot.adoptedStyleSheets = [componentSheet];

        if (src) {
            this.shadowRoot.innerHTML = `<img src="${src}" alt="${altRaw}" part="avatar" />`;
        } else {
            const words = altRaw.trim().split(/\s+/);
            const displayText =
                words.length >= 2
                    ? words[0].charAt(0) + words[1].charAt(0)
                    : altRaw.substring(0, 2);
            this.shadowRoot.innerHTML = `<div class="avatar" part="avatar"><h5>${displayText}</h5></div>`;
        }
    }

    _getColorVars(color) {
        const map = {
            base: ["var(--base-content--)", "var(--base-content-inverse)"],
            primary: [
                "var(--primary-content--)",
                "var(--primary-content-inverse)",
            ],
            secondary: [
                "var(--secondary-content--)",
                "var(--secondary-content-inverse)",
            ],
            success: [
                "var(--success-content--)",
                "var(--success-content-inverse)",
            ],
            warning: [
                "var(--warning-content--)",
                "var(--warning-content-inverse)",
            ],
            error: ["var(--error-content--)", "var(--error-content-inverse)"],
            help: ["var(--help-content--)", "var(--help-content-inverse)"],
        };
        return map[color] || map.primary;
    }
}

if (!customElements.get("y-avatar")) {
    customElements.define("y-avatar", YumeAvatar);
}
