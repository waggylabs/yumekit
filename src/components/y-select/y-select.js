import "../y-icon/y-icon.js";
import {
    contrastTextColor,
    createElement as _el,
    isSafeCssColor,
    manageLabelVisibility,
} from "../../modules/helpers.js";

const SEMANTIC_COLOR_VARS = {
    primary: ["var(--primary-content--)", "var(--primary-content-inverse)"],
    secondary: [
        "var(--secondary-content--)",
        "var(--secondary-content-inverse)",
    ],
    success: ["var(--success-content--)", "var(--success-content-inverse)"],
    warning: ["var(--warning-content--)", "var(--warning-content-inverse)"],
    error: ["var(--error-content--)", "var(--error-content-inverse)"],
    help: ["var(--help-content--)", "var(--help-content-inverse)"],
};

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
            "portal",
            "variant",
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
        this._portalContainer = null;

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
        this._deactivatePortal();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            if (this.hasAttribute("multiple")) {
                this.selectedValues = new Set(
                    (newValue || "")
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                );
            } else {
                this._value = newValue || "";
            }

            this._updateDisplay();
            this._internals.setFormValue(newValue, this.getAttribute("name"));
            this._updateSelectedStyles();
        }

        if (
            [
                "label-position",
                "disabled",
                "invalid",
                "required",
                "placeholder",
                "options",
                "size",
                "searchable",
                "clearable",
            ].includes(name)
        ) {
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
    get clearable() {
        return this.hasAttribute("clearable");
    }
    set clearable(val) {
        if (val) this.setAttribute("clearable", "");
        else this.removeAttribute("clearable");
    }

    /** @type {boolean} Whether the select is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {string} Display mode: "tag" for multi-select tag display. */
    get displayMode() {
        return this.getAttribute("display-mode") || "";
    }
    set displayMode(val) {
        this.setAttribute("display-mode", val);
    }

    /** @type {boolean} Whether the select is in an invalid state. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {string} Label position: "top" | "bottom" (default "top"). */
    get labelPosition() {
        return this.getAttribute("label-position") || "top";
    }
    set labelPosition(val) {
        this.setAttribute("label-position", val);
    }

    /** @type {boolean} Whether multiple values can be selected. */
    get multiple() {
        return this.hasAttribute("multiple");
    }
    set multiple(val) {
        if (val) this.setAttribute("multiple", "");
        else this.removeAttribute("multiple");
    }

    /** @type {string} The form field name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {Array<{value: string, label: string}>} The options array for the select. */
    get options() {
        try {
            return JSON.parse(this.getAttribute("options") || "[]");
        } catch {
            return [];
        }
    }
    set options(val) {
        this.setAttribute(
            "options",
            Array.isArray(val) ? JSON.stringify(val) : (val ?? "[]"),
        );
    }

    /** @type {string} Placeholder text when no value is selected. */
    get placeholder() {
        return this.getAttribute("placeholder") || "Select...";
    }
    set placeholder(val) {
        this.setAttribute("placeholder", val);
    }

    /** @type {boolean} Whether the select requires a value. */
    get required() {
        return this.hasAttribute("required");
    }
    set required(val) {
        if (val) this.setAttribute("required", "");
        else this.removeAttribute("required");
    }

    /** @type {boolean} Whether the dropdown shows an inline search filter input. */
    get searchable() {
        return this.hasAttribute("searchable");
    }
    set searchable(val) {
        if (val) this.setAttribute("searchable", "");
        else this.removeAttribute("searchable");
    }

    /**
     * When true, the dropdown is positioned with `position: fixed` (viewport
     * coordinates) so it escapes any ancestor with `overflow: auto/hidden/scroll`.
     * Useful when the select sits inside a scrollable container (e.g. a data
     * grid cell editor) and the dropdown would otherwise be clipped.
     */
    get portal() {
        return this.hasAttribute("portal");
    }
    set portal(val) {
        if (val) this.setAttribute("portal", "");
        else this.removeAttribute("portal");
    }

    /** @type {string} Select size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /**
     * @type {"default"|"underline"} Field style. `"default"` is a full border;
     * `"underline"` shows only a bottom border with square bottom corners on the
     * trigger (the dropdown panel is unaffected).
     */
    get variant() {
        return this.getAttribute("variant") === "underline"
            ? "underline"
            : "default";
    }
    set variant(val) {
        this.setAttribute("variant", val === "underline" ? "underline" : "default");
    }

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
                this.selectedValues = new Set(
                    val.split(",").map((v) => v.trim()),
                );
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
        this._deactivatePortal();
    }

    render() {
        this.closeDropdown();
        this._applyStyles();
        this.shadowRoot.replaceChildren(this._generateTree());
        this._queryRefs();
        manageLabelVisibility(this.labelWrapper);
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

        const paddingVar =
            {
                small: "--component-inputs-padding-small",
                medium: "--component-inputs-padding-medium",
                large: "--component-inputs-padding-large",
            }[size] || "--component-inputs-padding-medium";

        const minHeightVar =
            {
                small: "var(--sizing-small, 32px)",
                medium: "var(--sizing-medium, 40px)",
                large: "var(--sizing-large, 56px)",
            }[size] || "var(--sizing-medium, 40px)";

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: flex;
                flex-direction: column;
                font-family: var(--font-family-body);
                color: var(--component-select-color);
                opacity: ${isDisabled ? "0.75" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .select-wrapper {
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .label-wrapper {
                display: none;
                margin-bottom: var(--spacing-2x-small, 4px);
            }

            .select-container {
                flex: 1;
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

            /* Underline variant: bottom border only, square bottom corners
               (trigger only — the dropdown panel keeps its full border). */
            :host([variant="underline"]) .select-container {
                border-style: none;
                border-bottom-style: solid;
                border-radius: var(--component-inputs-border-radius-outer) var(--component-inputs-border-radius-outer) 0 0;
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
                position: absolute;
                z-index: var(--component-select-z-index, 6000);
                left: 0;
                right: 0;
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
                cursor: pointer;
                color: inherit;
                opacity: 0.6;
                flex-shrink: 0;
            }

            .clear-button:hover {
                opacity: 1;
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
            this.searchInput?.addEventListener("click", (e) =>
                e.stopPropagation(),
            );
        } else {
            this.selectContainer.addEventListener("click", () =>
                this.toggleDropdown(),
            );
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
                    this.searchInput.placeholder =
                        this.getAttribute("placeholder") || "Select...";
                    this.searchInput.focus();
                    if (!this.dropdown.classList.contains("open")) {
                        this._openDropdown();
                    }
                }
            }
            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: { value: "" },
                    bubbles: true,
                    composed: true,
                }),
            );
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

                    this.setAttribute(
                        "value",
                        Array.from(this.selectedValues).join(","),
                    );
                } else {
                    const isSelected = val === this.value;
                    if (isSelected && !isRequired) {
                        this.value = "";
                    } else {
                        this.value = val;
                    }
                }

                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: { value: this.value },
                        bubbles: true,
                        composed: true,
                    }),
                );

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
        if (noResults)
            noResults.style.display = visibleCount === 0 ? "" : "none";
    }

    _generateTree() {
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

        const buildClearButton = () => {
            const btn = _el(
                "button",
                {
                    class: "clear-button",
                    tabindex: "-1",
                    type: "button",
                },
                [_el("y-icon", { name: "x", size: "medium" })],
            );
            btn.style.display = "none";
            return btn;
        };

        const buildSearchInput = () =>
            _el("input", {
                class: "search-input",
                type: "text",
                placeholder,
                autocomplete: "off",
            });

        const buildLabelSlot = () =>
            _el("div", { class: "label-wrapper" }, [
                _el("slot", { name: "label" }),
            ]);

        const containerChildren = [];
        if (isSearchable && !isMulti) {
            containerChildren.push(buildSearchInput(), buildClearButton());
        } else if (isSearchable && isMulti && isTagMode) {
            containerChildren.push(
                _el("div", { class: "value-display" }, [buildSearchInput()]),
            );
            if (isClearable) containerChildren.push(buildClearButton());
        } else if (isMulti && isTagMode) {
            containerChildren.push(_el("div", { class: "value-display" }));
            if (isClearable) containerChildren.push(buildClearButton());
        } else if (showClearButton) {
            const display = _el("div", { class: "value-display" });
            display.textContent = this._getDisplayText();
            containerChildren.push(display, buildClearButton());
        } else {
            const display = _el("div", { class: "value-display" });
            display.textContent = this._getDisplayText();
            containerChildren.push(display);
        }

        const chevron = _el(
            "div",
            { class: "chevron-icon", part: "chevron-icon" },
            [_el("y-icon", { name: "chevron-down", size: "medium" })],
        );
        containerChildren.push(chevron);

        const selectContainer = _el(
            "div",
            {
                class: isInvalid
                    ? "select-container is-invalid"
                    : "select-container",
                tabindex: isSearchable ? "-1" : "0",
            },
            containerChildren,
        );

        const dropdown = _el(
            "div",
            { class: "dropdown", part: "dropdown" },
            [
                ...this.options.map((opt) =>
                    this._buildDropdownItem(opt, valueSet.has(opt.value)),
                ),
                (() => {
                    const noResults = _el("div", { class: "no-results" });
                    noResults.style.display = "none";
                    noResults.textContent = "No results";
                    return noResults;
                })(),
            ],
        );

        const wrapperChildren = [];
        if (isLabelTop) wrapperChildren.push(buildLabelSlot());
        wrapperChildren.push(selectContainer);
        if (!isLabelTop) wrapperChildren.push(buildLabelSlot());
        wrapperChildren.push(dropdown);

        return _el("div", { class: "select-wrapper" }, wrapperChildren);
    }

    _buildDropdownItem(opt, isSelected) {
        const item = _el("div", {
            class: isSelected ? "dropdown-item selected" : "dropdown-item",
            "data-value": opt.value,
            "data-color": opt.color || "",
        });
        item.textContent = opt.label;

        if (isSelected && opt.color) {
            const semantic = SEMANTIC_COLOR_VARS[opt.color];
            if (semantic) {
                item.style.setProperty("background", semantic[0]);
                item.style.setProperty("color", semantic[1]);
            } else if (isSafeCssColor(opt.color)) {
                item.style.setProperty("background", opt.color);
                item.style.setProperty("color", contrastTextColor(opt.color));
            }
        }

        return item;
    }

    _getDisplayText() {
        const isMulti = this.hasAttribute("multiple");
        const isTagMode = this.getAttribute("display-mode") === "tag";

        if (isMulti && isTagMode) return "";

        if (isMulti) {
            const count = this.options.filter((opt) =>
                this.selectedValues.has(opt.value),
            ).length;
            return count > 0
                ? `${count} Selected`
                : this.getAttribute("placeholder") || "Select...";
        } else {
            const selected = this.options.find(
                (opt) => opt.value === this.value,
            );
            return (
                selected?.label ||
                this.getAttribute("placeholder") ||
                "Select..."
            );
        }
    }

    _onDocumentClick(e) {
        if (this.getAttribute("close-on-click-outside") === "false") return;

        const path = e.composedPath();
        const insideHost = path.includes(this);
        // When portaled, the dropdown lives in document.body — treat clicks on
        // the portal container (and its shadow descendants) as "inside" too.
        const insidePortal = this._portalContainer && path.includes(this._portalContainer);

        if (!insideHost && !insidePortal && this.dropdown?.classList.contains("open")) {
            this.closeDropdown();
        }
    }

    _activatePortal() {
        if (this._portalContainer) return;
        if (!this.dropdown) return;

        const portal = document.createElement("div");
        portal.className = "y-select-portal";
        const shadow = portal.attachShadow({ mode: "open" });
        shadow.adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets;

        // Move the dropdown into the portal's shadow root. The wrapper still
        // references `this.dropdown`, so positioning math and event handlers
        // continue working unchanged.
        shadow.appendChild(this.dropdown);
        document.body.appendChild(portal);
        this._portalContainer = portal;
    }

    _deactivatePortal() {
        if (!this._portalContainer) return;
        // Move the dropdown back to the wrapper before removing the portal,
        // so subsequent `render()` cycles can locate and replace it cleanly.
        const wrapper = this.shadowRoot.querySelector(".select-wrapper");
        if (wrapper && this.dropdown && this.dropdown.parentNode !== wrapper) {
            wrapper.appendChild(this.dropdown);
        }
        this._portalContainer.remove();
        this._portalContainer = null;
    }

    _openDropdown() {
        if (this.dropdown.classList.contains("open")) return;
        if (this.portal) this._activatePortal();
        this.dropdown.classList.add("open");
        this.selectContainer.classList.add("open");
        this._positionDropdown();
        this._onScrollOrResize = this._positionDropdown.bind(this);

        // For single searchable: clear input so user can type fresh
        if (
            this.searchable &&
            !this.hasAttribute("multiple") &&
            this.searchInput
        ) {
            const currentLabel = this.value ? this._getDisplayText() : "";
            this.searchInput.placeholder =
                currentLabel || this.getAttribute("placeholder") || "Select...";
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
        const maxH = 200;
        const spaceBelow = window.innerHeight - rect.bottom - gap;

        if (this.portal) {
            // Viewport-relative positioning so the dropdown escapes any ancestor
            // with `overflow: auto/hidden/scroll`.
            this.dropdown.style.position = "fixed";
            this.dropdown.style.left = `${rect.left}px`;
            this.dropdown.style.right = "auto";
            this.dropdown.style.width = `${rect.width}px`;
            if (spaceBelow >= maxH || spaceBelow >= rect.top) {
                this.dropdown.style.top = `${rect.bottom + gap}px`;
                this.dropdown.style.bottom = "auto";
            } else {
                this.dropdown.style.top = "auto";
                this.dropdown.style.bottom = `${window.innerHeight - rect.top + gap}px`;
            }
            return;
        }

        const wrapper = this.selectContainer.parentElement;
        if (spaceBelow >= maxH || spaceBelow >= rect.top) {
            this.dropdown.style.top = `${this.selectContainer.offsetTop + this.selectContainer.offsetHeight + gap}px`;
            this.dropdown.style.bottom = "auto";
        } else {
            this.dropdown.style.bottom = `${wrapper.offsetHeight - this.selectContainer.offsetTop + gap}px`;
            this.dropdown.style.top = "auto";
        }
    }

    _queryRefs() {
        this.selectContainer =
            this.shadowRoot.querySelector(".select-container");
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

        const selected = this.options.filter((opt) =>
            this.selectedValues.has(opt.value),
        );

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
                this.setAttribute(
                    "value",
                    Array.from(this.selectedValues).join(","),
                );
                this._renderTags();
                this._updateSelectedStyles();
                this.updateValidation();

                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: { value: this.value },
                        bubbles: true,
                        composed: true,
                    }),
                );
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
                this.clearButton.style.display =
                    this.selectedValues.size > 0 ? "flex" : "none";
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
            const isSelected = valueSet.has(val);
            item.classList.toggle("selected", isSelected);
            const color = item.getAttribute("data-color");
            if (isSelected && color) {
                const semantic = SEMANTIC_COLOR_VARS[color];
                if (semantic) {
                    item.style.background = semantic[0];
                    item.style.color = semantic[1];
                } else if (isSafeCssColor(color)) {
                    item.style.background = color;
                    item.style.color = contrastTextColor(color);
                } else {
                    item.style.background = "";
                    item.style.color = "";
                }
            } else {
                item.style.background = "";
                item.style.color = "";
            }
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
