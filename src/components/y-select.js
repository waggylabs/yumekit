import { chevronDown } from "../icons/index.js";

export class YumeSelect extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "label-position",
            "disabled",
            "invalid",
            "required",
            "value",
            "name",
            "placeholder",
            "options",
            "display-mode",
            "close-on-click-outside",
            "size",
            "searchable",
            "clearable",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.selectedValues = new Set();
        this._onDocumentClick = this._onDocumentClick.bind(this);

        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("label-position")) {
            this.setAttribute("label-position", "top");
        }

        this.updateValidation();
        this._internals.setFormValue(this.value);
    }

    disconnectedCallback() {
        this.closeDropdown();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            if (this.hasAttribute("multiple")) {
                this.selectedValues = new Set(
                    (newValue || "").split(",").map((v) => v.trim()).filter(Boolean),
                );
            } else {
                this._value = newValue || "";
            }

            this._updateDisplay();
            this._internals.setFormValue(newValue, this.getAttribute("name"));
            this._updateSelectedStyles();
        }

        if ([
            "label-position",
            "disabled",
            "invalid",
            "required",
            "placeholder",
            "options",
            "size",
            "searchable",
            "clearable",
        ].includes(name)) {
            this.render();
        }

        if (name === "name") {
            this._internals.setFormValue(this.value, newValue);
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether to show a clear button when a value is selected. */
    get clearable() { return this.hasAttribute("clearable"); }
    set clearable(val) {
        if (val) this.setAttribute("clearable", "");
        else this.removeAttribute("clearable");
    }

    /** @type {boolean} Whether the select is disabled. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {string} Display mode: "tag" for multi-select tag display. */
    get displayMode() { return this.getAttribute("display-mode") || ""; }
    set displayMode(val) { this.setAttribute("display-mode", val); }

    /** @type {boolean} Whether the select is in an invalid state. */
    get invalid() { return this.hasAttribute("invalid"); }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {string} Label position: "top" | "bottom" (default "top"). */
    get labelPosition() { return this.getAttribute("label-position") || "top"; }
    set labelPosition(val) { this.setAttribute("label-position", val); }

    /** @type {boolean} Whether multiple values can be selected. */
    get multiple() { return this.hasAttribute("multiple"); }
    set multiple(val) {
        if (val) this.setAttribute("multiple", "");
        else this.removeAttribute("multiple");
    }

    /** @type {string} The form field name. */
    get name() { return this.getAttribute("name") || ""; }
    set name(val) { this.setAttribute("name", val); }

    /** @type {Array<{value: string, label: string}>} The options array for the select. */
    get options() {
        try {
            return JSON.parse(this.getAttribute("options") || "[]");
        } catch {
            return [];
        }
    }
    set options(val) {
        this.setAttribute("options", Array.isArray(val) ? JSON.stringify(val) : (val ?? "[]"));
    }

    /** @type {string} Placeholder text when no value is selected. */
    get placeholder() { return this.getAttribute("placeholder") || "Select..."; }
    set placeholder(val) { this.setAttribute("placeholder", val); }

    /** @type {boolean} Whether the select requires a value. */
    get required() { return this.hasAttribute("required"); }
    set required(val) {
        if (val) this.setAttribute("required", "");
        else this.removeAttribute("required");
    }

    /** @type {boolean} Whether the dropdown shows an inline search filter input. */
    get searchable() { return this.hasAttribute("searchable"); }
    set searchable(val) {
        if (val) this.setAttribute("searchable", "");
        else this.removeAttribute("searchable");
    }

    /** @type {string} Select size: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** @type {string} The current selected value, or comma-separated values when multiple. */
    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        }
        return this._value || "";
    }
    set value(val) {
        if (this.hasAttribute("multiple")) {
            if (typeof val === "string") {
                this.selectedValues = new Set(val.split(",").map((v) => v.trim()));
            } else if (Array.isArray(val)) {
                this.selectedValues = new Set(val);
            }
        } else {
            this._value = val;
        }

        this.setAttribute("value", val);
        this._internals.setFormValue(this.value, this.getAttribute("name"));
        this._updateDisplay();
        this._updateSelectedStyles();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Closes the dropdown. */
    closeDropdown() {
        this.dropdown?.classList.remove("open");
        this.selectContainer?.classList.remove("open");
        document.removeEventListener("click", this._onDocumentClick, true);

        if (this.searchable) {
            const isMulti = this.hasAttribute("multiple");
            if (!isMulti && this.searchInput) {
                const selectedLabel = this.value ? this._getDisplayText() : "";
                this.searchInput.value = selectedLabel;
                this.searchInput.placeholder = selectedLabel
                    ? ""
                    : this.getAttribute("placeholder") || "Select...";
            } else if (isMulti && this.searchInput) {
                this.searchInput.value = "";
            }
            this._filterOptions("");
        }

        if (this._onScrollOrResize) {
            window.removeEventListener("scroll", this._onScrollOrResize, true);
            window.removeEventListener("resize", this._onScrollOrResize);
            this._onScrollOrResize = null;
        }
    }

    render() {
        this.closeDropdown();
        this._applyStyles();
        this.shadowRoot.innerHTML = this._generateTemplate();
        this._queryRefs();
        this._attachEventListeners();
        this._updateValidationState();
        this._updateDisplay();
        this._updateSelectedStyles();
    }

    /** Toggles the dropdown open or closed. */
    toggleDropdown() {
        if (this.dropdown.classList.contains("open")) {
            this.closeDropdown();
        } else {
            this._openDropdown();
            if (this.searchable && this.searchInput) {
                setTimeout(() => this.searchInput.focus(), 0);
            }
        }
    }

    /** Validates the current selection and sets/removes the invalid attribute. */
    updateValidation() {
        const required = this.hasAttribute("required");
        const isMulti = this.hasAttribute("multiple");
        const isValid = isMulti
            ? this.selectedValues.size > 0
            : this.value && this.value !== "";

        if (required && !isValid) {
            this.setAttribute("invalid", "");
        } else {
            this.removeAttribute("invalid");
        }
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyStyles() {
        const isDisabled = this.hasAttribute("disabled");
        const size = this.getAttribute("size") || "medium";

        const paddingVar = {
            small: "--component-inputs-padding-small",
            medium: "--component-inputs-padding-medium",
            large: "--component-inputs-padding-large",
        }[size] || "--component-inputs-padding-medium";

        const minHeightVar = {
            small: "var(--sizing-small, 32px)",
            medium: "var(--sizing-medium, 40px)",
            large: "var(--sizing-large, 56px)",
        }[size] || "var(--sizing-medium, 40px)";

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-select-color);
                opacity: ${isDisabled ? "0.75" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .select-wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
                position: relative;
            }

            .select-container {
                display: flex;
                align-items: center;
                gap: var(--spacing-x-small);
                background: var(--component-select-background);
                border: var(--component-inputs-border-width) solid var(--component-select-border-color);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: var(${paddingVar});
                min-height: ${minHeightVar};
                box-sizing: border-box;
                transition: border-color 0.2s ease-in-out;
                cursor: pointer;
            }

            .select-container:hover {
                border-color: var(--component-select-color);
            }

            .select-container:focus-within {
                border-color: var(--component-select-accent);
            }

            .select-container.is-invalid {
                border-color: var(--component-select-error-border-color);
                background: var(--component-select-error-background);
            }

            .select-container.is-invalid:hover {
                border-color: var(--component-select-error-color);
            }

            .select-container.is-invalid:focus-within {
                border-color: var(--component-select-error-color);
            }

            .label-wrapper.is-invalid ::slotted([slot="label"]) {
                color: var(--component-select-error-color);
            }

            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-select-label-color);
            }

            .dropdown {
                position: fixed;
                z-index: var(--component-select-z-index, 6000);
                background: var(--component-select-background);
                border: var(--component-inputs-border-width) solid var(--component-select-border-color);
                border-radius: var(--component-inputs-border-radius-outer);
                box-shadow: var(--component-select-shadow, 0 2px 8px rgba(0,0,0,0.1));
                max-height: 200px;
                overflow-y: auto;
                display: none;
            }

            .dropdown.open {
                display: block;
            }

            .no-results {
                padding: var(--spacing-small, 6px);
                color: var(--component-select-label-color);
                text-align: center;
                font-size: 0.875em;
            }

            .dropdown-item {
                padding: var(--spacing-small, 6px);
                cursor: pointer;
            }

            .dropdown-item:hover {
                background: var(--component-select-hover-background);
            }

            .dropdown-item.selected {
                background: var(--component-select-accent);
                color: var(--component-select-accent-contrast);
            }

            .value-display {
                flex: 1;
                font-size: 1em;
                color: inherit;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: var(--spacing-x-small);
            }

            .search-input {
                flex: 1;
                min-width: 60px;
                border: none;
                background: transparent;
                color: inherit;
                font-family: inherit;
                font-size: 1em;
                outline: none;
                padding: 0;
                cursor: text;
            }

            .search-input::placeholder {
                color: var(--component-select-label-color);
            }

            .clear-button {
                display: flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: none;
                padding: 2px;
                cursor: pointer;
                color: inherit;
                opacity: 0.6;
                flex-shrink: 0;
            }

            .clear-button:hover {
                opacity: 1;
            }

            .label-wrapper {
                display: block;
            }

            .chevron-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: auto;
                transition: transform 0.2s ease;
            }

            .chevron-icon svg {
                width: 20px;
                height: 20px;
                transition: transform 0.2s ease;
                transform-origin: center;
            }

            .select-container.open .chevron-icon svg {
                transform: scaleY(-1);
            }
        `);

        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    _attachEventListeners() {
        const isSearchable = this.searchable;
        const isMulti = this.hasAttribute("multiple");
        const isTagMode = this.getAttribute("display-mode") === "tag";

        if (isSearchable) {
            // Container click → focus the search input (input focus will open the dropdown)
            this.selectContainer.addEventListener("click", (e) => {
                if (!e.target.closest(".chevron-icon")) {
                    this.searchInput?.focus();
                }
            });

            // Chevron → toggle
            const chevronEl = this.shadowRoot.querySelector(".chevron-icon");
            chevronEl?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });

            // Input focus → open dropdown
            this.searchInput?.addEventListener("focus", () => {
                if (!this.dropdown.classList.contains("open")) {
                    this._openDropdown();
                }
            });

            // Input → filter
            this.searchInput?.addEventListener("input", (e) => {
                this._filterOptions(e.target.value);
            });

            // Prevent input click from bubbling to container (avoid re-focusing)
            this.searchInput?.addEventListener("click", (e) => e.stopPropagation());
        } else {
            this.selectContainer.addEventListener("click", () => this.toggleDropdown());
        }

        // Clear button click → clear selection
        this.clearButton?.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.hasAttribute("multiple")) {
                this.selectedValues = new Set();
                this.setAttribute("value", "");
                this._renderTags();
                this._updateSelectedStyles();
                if (this.clearButton) this.clearButton.style.display = "none";
            } else {
                this.value = "";
                this._filterOptions("");
                if (this.searchInput) {
                    this.searchInput.value = "";
                    this.searchInput.placeholder = this.getAttribute("placeholder") || "Select...";
                    this.searchInput.focus();
                    if (!this.dropdown.classList.contains("open")) {
                        this._openDropdown();
                    }
                }
            }
            this.dispatchEvent(new CustomEvent("change", {
                detail: { value: "" },
                bubbles: true,
                composed: true,
            }));
            this.updateValidation();
        });

        this.dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
            item.addEventListener("click", () => {
                const val = item.getAttribute("data-value");
                const isRequired = this.hasAttribute("required");

                if (isMulti) {
                    if (this.selectedValues.has(val)) {
                        if (!isRequired || this.selectedValues.size > 1) {
                            this.selectedValues.delete(val);
                        }
                    } else {
                        this.selectedValues.add(val);
                    }

                    this.setAttribute("value", Array.from(this.selectedValues).join(","));
                } else {
                    const isSelected = val === this.value;
                    if (isSelected && !isRequired) {
                        this.value = "";
                    } else {
                        this.value = val;
                    }
                }

                this.dispatchEvent(new CustomEvent("change", {
                    detail: { value: this.value },
                    bubbles: true,
                    composed: true,
                }));

                this.updateValidation();

                if (isSearchable && isMulti && isTagMode) {
                    // Keep dropdown open for multi-tag searchable; clear and refocus input
                    if (this.searchInput) {
                        this.searchInput.value = "";
                        this._filterOptions("");
                        this.searchInput.focus();
                    }
                    this._updateSelectedStyles();
                } else {
                    this.closeDropdown();
                }
            });
        });
    }

    _filterOptions(query) {
        if (!this.dropdown) return;
        const q = query.toLowerCase();
        let visibleCount = 0;

        this.dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
            const matches = !q || item.textContent.toLowerCase().includes(q);
            item.style.display = matches ? "" : "none";
            if (matches) visibleCount++;
        });

        const noResults = this.dropdown.querySelector(".no-results");
        if (noResults) noResults.style.display = visibleCount === 0 ? "" : "none";
    }

    _generateTemplate() {
        const labelPosition = this.getAttribute("label-position") || "top";
        const isLabelTop = labelPosition === "top";
        const isInvalid = this.hasAttribute("invalid");
        const isMulti = this.hasAttribute("multiple");
        const isTagMode = this.getAttribute("display-mode") === "tag";
        const isSearchable = this.searchable;
        const isClearable = this.clearable;
        const showClearButton = (isSearchable || isClearable) && !isMulti;
        const valueSet = isMulti ? this.selectedValues : new Set([this.value]);
        const placeholder = this.getAttribute("placeholder") || "Select...";
        const clearButtonHTML = `<button class="clear-button" style="display:none" tabindex="-1" type="button"><y-icon name="close" size="medium"></y-icon></button>`;

        let containerInner;
        if (isSearchable && !isMulti) {
            // Single searchable: inline input replacing the value display
            containerInner = `
                <input class="search-input" type="text" placeholder="${placeholder}" autocomplete="off">
                ${clearButtonHTML}
            `;
        } else if (isSearchable && isMulti && isTagMode) {
            // Multi-tag searchable: input lives inside the value display after tags
            containerInner = `
                <div class="value-display">
                    <input class="search-input" type="text" placeholder="${placeholder}" autocomplete="off">
                </div>
                ${isClearable ? clearButtonHTML : ""}
            `;
        } else if (isMulti && isTagMode) {
            // Multi-tag (non-searchable): tags + optional clear button
            containerInner = `
                <div class="value-display"></div>
                ${isClearable ? clearButtonHTML : ""}
            `;
        } else if (showClearButton) {
            // Clearable but not searchable: value display + clear button
            containerInner = `
                <div class="value-display">${this._getDisplayText()}</div>
                <button class="clear-button" style="display:none" tabindex="-1" type="button">
                    <y-icon name="close" size="medium"></y-icon>
                </button>
            `;
        } else {
            // Default
            containerInner = `<div class="value-display">${this._getDisplayText()}</div>`;
        }

        return `
            <div class="select-wrapper">
                ${isLabelTop ? '<div class="label-wrapper"><slot name="label"></slot></div>' : ""}
                <div class="select-container ${isInvalid ? "is-invalid" : ""}" tabindex="${isSearchable ? "-1" : "0"}">
                    ${containerInner}
                    <div class="chevron-icon" part="chevron-icon">
                        ${chevronDown}
                    </div>
                </div>
                ${!isLabelTop ? '<div class="label-wrapper"><slot name="label"></slot></div>' : ""}
                <div class="dropdown" part="dropdown">
                    ${this.options
                        .map((opt) => `
                        <div class="dropdown-item ${valueSet.has(opt.value) ? "selected" : ""}" data-value="${opt.value}">
                            ${opt.label}
                        </div>
                    `)
                        .join("")}
                    <div class="no-results" style="display:none">No results</div>
                </div>
            </div>
        `;
    }

    _getDisplayText() {
        const isMulti = this.hasAttribute("multiple");
        const isTagMode = this.getAttribute("display-mode") === "tag";

        if (isMulti && isTagMode) return "";

        if (isMulti) {
            const count = this.options.filter((opt) => this.selectedValues.has(opt.value)).length;
            return count > 0
                ? `${count} Selected`
                : this.getAttribute("placeholder") || "Select...";
        } else {
            const selected = this.options.find((opt) => opt.value === this.value);
            return selected?.label || this.getAttribute("placeholder") || "Select...";
        }
    }

    _onDocumentClick(e) {
        if (this.getAttribute("close-on-click-outside") === "false") return;

        const path = e.composedPath();

        if (!path.includes(this) && this.dropdown?.classList.contains("open")) {
            this.closeDropdown();
        }
    }

    _openDropdown() {
        if (this.dropdown.classList.contains("open")) return;
        this.dropdown.classList.add("open");
        this.selectContainer.classList.add("open");
        this._positionDropdown();
        this._onScrollOrResize = this._positionDropdown.bind(this);

        // For single searchable: clear input so user can type fresh
        if (this.searchable && !this.hasAttribute("multiple") && this.searchInput) {
            const currentLabel = this.value ? this._getDisplayText() : "";
            this.searchInput.placeholder = currentLabel || this.getAttribute("placeholder") || "Select...";
            this.searchInput.value = "";
            this._filterOptions("");
        }

        window.addEventListener("scroll", this._onScrollOrResize, true);
        window.addEventListener("resize", this._onScrollOrResize);
        document.addEventListener("click", this._onDocumentClick, true);
    }

    _positionDropdown() {
        const rect = this.selectContainer.getBoundingClientRect();
        const gap = 4;

        this.dropdown.style.left = `${rect.left}px`;
        this.dropdown.style.width = `${rect.width}px`;

        const spaceBelow = window.innerHeight - rect.bottom - gap;
        const maxH = 200;

        if (spaceBelow >= maxH || spaceBelow >= rect.top) {
            this.dropdown.style.top = `${rect.bottom + gap}px`;
            this.dropdown.style.bottom = "auto";
        } else {
            this.dropdown.style.bottom = `${window.innerHeight - rect.top + gap}px`;
            this.dropdown.style.top = "auto";
        }
    }

    _queryRefs() {
        this.selectContainer = this.shadowRoot.querySelector(".select-container");
        this.dropdown = this.shadowRoot.querySelector(".dropdown");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");
        this.displayElement = this.shadowRoot.querySelector(".value-display");
        this.searchInput = this.shadowRoot.querySelector(".search-input");
        this.clearButton = this.shadowRoot.querySelector(".clear-button");
    }

    _renderTags() {
        const isMulti = this.hasAttribute("multiple");
        const isTagMode = this.getAttribute("display-mode") === "tag";

        if (!isMulti || !isTagMode || !this.displayElement) return;

        const isSearchable = this.searchable;

        // Preserve the search input node before clearing
        const existingInput = isSearchable
            ? this.displayElement.querySelector(".search-input")
            : null;

        this.displayElement.innerHTML = "";

        const selected = this.options.filter((opt) => this.selectedValues.has(opt.value));

        selected.forEach((opt) => {
            const tag = document.createElement("y-tag");
            tag.setAttribute("removable", "");
            tag.setAttribute("size", "small");
            tag.setAttribute("color", opt.color || "primary");
            tag.setAttribute("style-type", "filled");
            tag.textContent = opt.label;
            tag.dataset.value = opt.value;

            tag.addEventListener("remove", () => {
                this.selectedValues.delete(opt.value);
                this.setAttribute("value", Array.from(this.selectedValues).join(","));
                this._renderTags();
                this._updateSelectedStyles();
                this.updateValidation();

                this.dispatchEvent(new CustomEvent("change", {
                    detail: { value: this.value },
                    bubbles: true,
                    composed: true,
                }));
            });

            this.displayElement.appendChild(tag);
        });

        // Re-append the search input after the tags
        if (existingInput) {
            this.displayElement.appendChild(existingInput);
        }
    }

    _updateDisplay() {
        const isTagMode = this.getAttribute("display-mode") === "tag";
        const isSearchable = this.searchable;
        const isMulti = this.hasAttribute("multiple");
        const isClearable = this.clearable;

        if (isTagMode) {
            this._renderTags();
            if (isClearable && this.clearButton) {
                this.clearButton.style.display = this.selectedValues.size > 0 ? "flex" : "none";
            }
        } else if (isSearchable && !isMulti && this.searchInput) {
            // Update inline search input to reflect current selection
            const isOpen = this.dropdown?.classList.contains("open");
            if (!isOpen) {
                const selectedLabel = this.value ? this._getDisplayText() : "";
                this.searchInput.value = selectedLabel;
                this.searchInput.placeholder = selectedLabel
                    ? ""
                    : this.getAttribute("placeholder") || "Select...";
            }
            if (this.clearButton) {
                this.clearButton.style.display = this.value ? "flex" : "none";
            }
        } else if (isClearable && !isMulti && this.displayElement) {
            // Clearable without search: update text and clear button visibility
            this.displayElement.textContent = this._getDisplayText();
            if (this.clearButton) {
                this.clearButton.style.display = this.value ? "flex" : "none";
            }
        } else if (this.displayElement) {
            this.displayElement.textContent = this._getDisplayText();
        }
    }

    _updateSelectedStyles() {
        const isMulti = this.hasAttribute("multiple");
        const valueSet = isMulti ? this.selectedValues : new Set([this.value]);

        this.dropdown?.querySelectorAll(".dropdown-item").forEach((item) => {
            const val = item.getAttribute("data-value");
            item.classList.toggle("selected", valueSet.has(val));
        });
    }

    _updateValidationState() {
        const isInvalid = this.hasAttribute("invalid");
        this.selectContainer?.classList.toggle("is-invalid", isInvalid);
        this.labelWrapper?.classList.toggle("is-invalid", isInvalid);
    }
}

if (!customElements.get("y-select")) {
    customElements.define("y-select", YumeSelect);
}
