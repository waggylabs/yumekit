import { createElement as _el, upgradeProperties } from "../../modules/helpers.js";
import "../y-icon/y-icon.js";
import "../y-progress/y-progress.js";

const VALID_SIZES = new Set(["small", "medium", "large"]);
const VALID_STATUSES = new Set(["pending", "uploading", "done", "error"]);
const PROMPT_ICON = "up-to-bracket";

export class YumeUpload extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "accept",
            "directory",
            "disabled",
            "max-files",
            "max-size",
            "max-total-size",
            "multiple",
            "name",
            "previews",
            "required",
            "show-list",
            "size",
            "variant",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._files = [];
        this._statuses = new Map();
        this._messages = new Map();
        this._progress = new Map();
        this._urls = new Map();
        this._rows = new Map();
        this._uid = `y-upload-${Math.random().toString(36).slice(2, 9)}`;

        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        this._syncFormValue();
        this._updateValidity();
    }

    disconnectedCallback() {
        this._revokeAllUrls();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "name") {
            this._syncFormValue();
            return;
        }

        if (name === "previews" && newValue === null) this._revokeAllUrls();

        this.render();
        this._updateValidity();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {string} Comma-separated list of accepted extensions / MIME types. */
    get accept() {
        return this.getAttribute("accept") || "";
    }
    set accept(val) {
        if (val == null || val === "") this.removeAttribute("accept");
        else this.setAttribute("accept", val);
    }

    /** @type {boolean} Whether folder selection (`webkitdirectory`) is allowed. */
    get directory() {
        return this.hasAttribute("directory");
    }
    set directory(val) {
        if (val) this.setAttribute("directory", "");
        else this.removeAttribute("directory");
    }

    /** @type {boolean} Whether the control is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {File[]} The current file list. Property only — not reflected. */
    get files() {
        return this._files.slice();
    }
    set files(val) {
        const next = Array.isArray(val) ? val.filter((f) => f instanceof File) : [];
        this._replaceFiles(next);
    }

    /** @type {number|null} Maximum number of files (only meaningful with `multiple`). */
    get maxFiles() {
        return this._numberAttr("max-files");
    }
    set maxFiles(val) {
        this._setNumberAttr("max-files", val);
    }

    /** @type {number|null} Maximum size per file, in bytes. */
    get maxSize() {
        return this._numberAttr("max-size");
    }
    set maxSize(val) {
        this._setNumberAttr("max-size", val);
    }

    /** @type {number|null} Maximum combined size of all files, in bytes. */
    get maxTotalSize() {
        return this._numberAttr("max-total-size");
    }
    set maxTotalSize(val) {
        this._setNumberAttr("max-total-size", val);
    }

    /** @type {boolean} Whether more than one file can be selected. */
    get multiple() {
        return this.hasAttribute("multiple");
    }
    set multiple(val) {
        if (val) this.setAttribute("multiple", "");
        else this.removeAttribute("multiple");
    }

    /** @type {string} Form field name each file is appended under. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {boolean} Whether image files show a thumbnail preview in the list. */
    get previews() {
        return this.hasAttribute("previews");
    }
    set previews(val) {
        if (val) this.setAttribute("previews", "");
        else this.removeAttribute("previews");
    }

    /** @type {boolean} Whether validation fails when no files are selected. */
    get required() {
        return this.hasAttribute("required");
    }
    set required(val) {
        if (val) this.setAttribute("required", "");
        else this.removeAttribute("required");
    }

    /** @type {boolean} Whether the managed file list is rendered (default true). */
    get showList() {
        return this.getAttribute("show-list") !== "false";
    }
    set showList(val) {
        this.setAttribute("show-list", val ? "true" : "false");
    }

    /** @type {string} Control size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        const s = this.getAttribute("size");
        return VALID_SIZES.has(s) ? s : "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** @type {"dropzone"|"button"} Presentation: full drop target or compact button. */
    get variant() {
        return this.getAttribute("variant") === "button" ? "button" : "dropzone";
    }
    set variant(val) {
        this.setAttribute("variant", val === "button" ? "button" : "dropzone");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Opens the native file picker programmatically. */
    browse() {
        if (this.disabled) return;
        this._input?.click();
    }

    /** Removes all files. */
    clear() {
        if (this._files.length === 0) return;
        this._replaceFiles([]);
        this._announce("All files removed.");
        this._emitChange();
    }

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(this._buildTree());
        this._queryRefs();
        this._wireEvents();
        this._renderList();
    }

    /**
     * Sets the progress bar (0–100) on a file's list row.
     * @param {File} file
     * @param {number} percent
     */
    setProgress(file, percent) {
        if (!this._files.includes(file)) return;
        const pct = Math.max(0, Math.min(100, Number(percent) || 0));
        this._progress.set(file, pct);
        this._applyRowState(file);
    }

    /**
     * Sets a row's status, optionally with an error message.
     * @param {File} file
     * @param {"pending"|"uploading"|"done"|"error"} status
     * @param {string} [message]
     */
    setStatus(file, status, message) {
        if (!this._files.includes(file)) return;
        if (!VALID_STATUSES.has(status)) return;
        this._statuses.set(file, status);
        if (message == null) this._messages.delete(file);
        else this._messages.set(file, message);
        this._applyRowState(file);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _announce(message) {
        if (this._liveRegion) this._liveRegion.textContent = message;
    }

    _applyRowState(file) {
        const refs = this._rows.get(file);
        if (!refs) return;

        const status = this._statuses.get(file);
        const message = this._messages.get(file);
        const pct = this._progress.get(file);
        const isError = status === "error";
        const isDone = status === "done";
        const showProgress =
            !isError && !isDone && (status === "uploading" || pct != null);

        refs.progress.style.display = showProgress ? "" : "none";
        if (pct != null) refs.progress.setAttribute("value", String(pct));

        refs.error.style.display = isError ? "" : "none";
        refs.error.textContent = isError ? message || "" : "";

        const iconName = isDone ? "check" : isError ? "triangle-exclamation" : "";
        refs.status.style.display = iconName ? "" : "none";
        refs.status.classList.toggle("is-error", isError);
        refs.status.classList.toggle("is-done", isDone);
        if (iconName) refs.status.setAttribute("name", iconName);
    }

    _buildConstraints() {
        const parts = [];
        if (this.accept) parts.push(`Accepted: ${this.accept}`);
        if (this.maxSize != null) {
            parts.push(`Max ${this._formatSize(this.maxSize)} per file`);
        }
        if (this.maxFiles != null && this.multiple) {
            parts.push(`Up to ${this.maxFiles} files`);
        }
        const el = _el("div", {
            class: "constraints",
            id: `${this._uid}-constraints`,
        });
        el.textContent = parts.join(" · ");
        el.style.display = parts.length ? "" : "none";
        return el;
    }

    _buildDropzone() {
        const isDisabled = this.disabled;
        const iconSize = this.variant === "button" ? this.size : "large";

        const iconSlot = _el("slot", { name: "icon", part: "icon" }, [
            _el("y-icon", { name: PROMPT_ICON, size: iconSize }),
        ]);
        const promptSlot = _el("slot", {}, [
            "Drag files here or click to browse",
        ]);
        const prompt = _el("div", { class: "prompt", part: "prompt" }, [
            promptSlot,
        ]);

        return _el(
            "div",
            {
                class: `dropzone dropzone--${this.variant}`,
                part: "dropzone",
                role: "button",
                tabindex: isDisabled ? null : "0",
                "aria-label": this.getAttribute("aria-label") || "Upload files",
                "aria-describedby": `${this._uid}-constraints`,
                "aria-disabled": isDisabled ? "true" : null,
            },
            [iconSlot, prompt],
        );
    }

    _buildRow(file) {
        const showPreview = this.previews;
        const isImage = (file.type || "").startsWith("image/");

        const children = [];
        if (showPreview) {
            children.push(this._buildRowPreview(file, isImage));
        }

        const name = _el("div", { class: "file-name", part: "file-name" });
        name.textContent = file.name;
        const size = _el("div", { class: "file-size", part: "file-size" });
        size.textContent = this._formatSize(file.size);

        const progress = _el("y-progress", {
            class: "file-progress",
            part: "file-progress",
            mode: "bar",
            size: "small",
            "label-display": "false",
            value: "0",
        });
        progress.style.display = "none";

        const error = _el("div", { class: "file-error", part: "file-error" });
        error.style.display = "none";

        const main = _el("div", { class: "file-main" }, [
            name,
            size,
            progress,
            error,
        ]);

        const status = _el("y-icon", {
            class: "file-status",
            name: "check",
            size: "small",
        });
        status.style.display = "none";

        const remove = _el(
            "button",
            {
                class: "remove-button",
                part: "remove-button",
                type: "button",
                "aria-label": `Remove ${file.name}`,
                disabled: this.disabled || null,
            },
            [_el("y-icon", { name: "x", size: "small" })],
        );
        remove.addEventListener("click", () => this._requestRemove(file));

        const row = _el("li", { class: "file", part: "file" }, [
            ...children,
            main,
            status,
            remove,
        ]);

        this._rows.set(file, { row, progress, error, status });
        return row;
    }

    _buildRowPreview(file, isImage) {
        const box = _el("div", { class: "file-preview", part: "file-preview" });
        if (isImage) {
            const img = _el("img", { alt: "", src: this._urlFor(file) });
            box.appendChild(img);
        } else {
            box.appendChild(_el("y-icon", { name: "clipboard", size: "medium" }));
        }
        return box;
    }

    _buildStyleSheet() {
        const paddingVar = `--component-upload-padding-${this.size}`;
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-upload-color, var(--base-content--));
            }

            :host([disabled]) {
                opacity: 0.6;
            }

            .wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-small, 6px);
            }

            .native-input {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
                border: 0;
            }

            .dropzone {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-x-small, 6px);
                box-sizing: border-box;
                background: var(--component-upload-background, var(--base-background-component));
                border: 1px dashed var(--component-upload-border-color, var(--base-border));
                border-width: var(--component-upload-border-width, 1px);
                border-radius: var(--component-upload-border-radius, 8px);
                color: var(--component-upload-prompt-color, var(--base-content-light));
                cursor: pointer;
                transition: border-color 0.2s ease, background-color 0.2s ease;
                outline: none;
            }

            .dropzone--dropzone {
                flex-direction: column;
                text-align: center;
                padding: var(${paddingVar}, 24px);
            }

            .dropzone--button {
                border-style: solid;
                padding: var(--component-inputs-padding-${this.size}, 8px 12px);
                width: fit-content;
            }

            .dropzone:focus-visible {
                border-color: var(--component-upload-border-color-dragover, var(--primary-content--));
                box-shadow: 0 0 0 2px var(--component-upload-border-color-dragover, var(--primary-content--));
            }

            :host([dragover]) .dropzone {
                border-color: var(--component-upload-border-color-dragover, var(--primary-content--));
                background: var(--component-upload-background-dragover, var(--base-background-hover));
            }

            :host([disabled]) .dropzone {
                cursor: not-allowed;
                pointer-events: none;
            }

            .prompt {
                font-size: 0.9em;
            }

            .constraints {
                font-size: 0.8em;
                color: var(--component-upload-prompt-color, var(--base-content-light));
            }

            .file-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-x-small, 6px);
            }

            .file {
                display: flex;
                align-items: center;
                gap: var(--spacing-small, 8px);
                padding: var(--spacing-x-small, 6px) var(--spacing-small, 8px);
                background: var(--component-upload-file-background, var(--base-background-hover));
                border-radius: var(--component-upload-file-border-radius, 4px);
                box-sizing: border-box;
            }

            .file-preview {
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border-radius: var(--component-upload-file-border-radius, 4px);
                background: var(--base-background-component);
            }

            .file-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .file-main {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .file-name {
                font-size: 0.9em;
                color: var(--component-upload-color, var(--base-content--));
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .file-size {
                font-size: 0.78em;
                color: var(--component-upload-prompt-color, var(--base-content-light));
            }

            .file-progress {
                margin-top: 2px;
            }

            .file-progress::part(bar) {
                background: var(--component-upload-progress-color, var(--primary-content--));
            }

            .file-error {
                font-size: 0.78em;
                color: var(--component-upload-error-color, var(--error-content--));
            }

            .file-status {
                flex-shrink: 0;
            }

            .file-status.is-done {
                color: var(--success-content--, green);
            }

            .file-status.is-error {
                color: var(--component-upload-error-color, var(--error-content--));
            }

            .remove-button {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2px;
                background: none;
                border: none;
                border-radius: var(--component-upload-file-border-radius, 4px);
                color: inherit;
                cursor: pointer;
                opacity: 0.7;
            }

            .remove-button:hover {
                opacity: 1;
            }

            .remove-button:disabled {
                cursor: not-allowed;
                opacity: 0.4;
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
                border: 0;
            }
        `);
        return sheet;
    }

    _buildTree() {
        const input = _el("input", {
            class: "native-input",
            type: "file",
            tabindex: "-1",
            "aria-hidden": "true",
            multiple: this.multiple || null,
            accept: this.accept || null,
            disabled: this.disabled || null,
        });
        if (this.directory) {
            input.setAttribute("webkitdirectory", "");
            input.setAttribute("directory", "");
        }

        const list = _el("ul", { class: "file-list", part: "file-list" });
        if (!this.showList) list.style.display = "none";

        const live = _el("div", {
            class: "sr-only",
            "aria-live": "polite",
            role: "status",
        });

        return _el("div", { class: "wrapper" }, [
            input,
            this._buildDropzone(),
            this._buildConstraints(),
            list,
            live,
        ]);
    }

    _dedupeKey(file) {
        return `${file.name}|${file.size}|${file.lastModified}`;
    }

    _emitChange() {
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { files: this.files },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _extractDropped(dataTransfer) {
        const files = [];
        const rejections = [];
        const items = dataTransfer.items;

        if (items && items.length && !this.directory) {
            for (const item of items) {
                if (item.kind !== "file") continue;
                const entry = item.webkitGetAsEntry?.();
                const file = item.getAsFile();
                if (entry && entry.isDirectory) {
                    rejections.push({
                        file: file || new File([], entry.name),
                        reason: "accept",
                    });
                } else if (file) {
                    files.push(file);
                }
            }
            if (files.length || rejections.length) return { files, rejections };
        }

        return { files: Array.from(dataTransfer.files || []), rejections };
    }

    _forgetFile(file) {
        const url = this._urls.get(file);
        if (url) URL.revokeObjectURL(url);
        this._urls.delete(file);
        this._statuses.delete(file);
        this._messages.delete(file);
        this._progress.delete(file);
        this._rows.delete(file);
    }

    _formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        const units = ["KB", "MB", "GB", "TB"];
        let value = bytes / 1024;
        let i = 0;
        while (value >= 1024 && i < units.length - 1) {
            value /= 1024;
            i += 1;
        }
        return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
    }

    _handleFiles(incoming, preRejections = []) {
        const list = Array.from(incoming || []);
        const candidates = this.multiple ? list : list.slice(0, 1);

        const kept = this.multiple ? this._files.slice() : [];
        const seen = new Set(kept.map((f) => this._dedupeKey(f)));

        const accepted = [];
        const rejections = [...preRejections];
        let count = kept.length;
        let total = kept.reduce((s, f) => s + f.size, 0);

        for (const file of candidates) {
            const key = this._dedupeKey(file);
            if (seen.has(key)) continue;

            const reason = this._rejectReason(file, count, total);
            if (reason) {
                rejections.push({ file, reason });
                continue;
            }

            seen.add(key);
            accepted.push(file);
            count += 1;
            total += file.size;
        }

        const next = this.multiple
            ? [...kept, ...accepted]
            : accepted.length
              ? accepted
              : this._files.slice();

        if (accepted.length) {
            this._replaceFiles(next);
            this._announce(
                `${accepted.length} file${accepted.length > 1 ? "s" : ""} added.`,
            );
            this._emitChange();
        }

        if (rejections.length) {
            this._announce(
                `${rejections.length} file${rejections.length > 1 ? "s" : ""} rejected.`,
            );
            this.dispatchEvent(
                new CustomEvent("reject", {
                    detail: { rejections },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    _matchesAccept(file) {
        const accept = this.accept.trim();
        if (!accept) return true;

        const tokens = accept
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
        const name = file.name.toLowerCase();
        const type = (file.type || "").toLowerCase();

        return tokens.some((token) => {
            if (token.startsWith(".")) return name.endsWith(token);
            if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
            return type === token;
        });
    }

    _numberAttr(attr) {
        if (!this.hasAttribute(attr)) return null;
        const n = Number(this.getAttribute(attr));
        return Number.isFinite(n) ? n : null;
    }

    _queryRefs() {
        this._input = this.shadowRoot.querySelector(".native-input");
        this._dropzone = this.shadowRoot.querySelector(".dropzone");
        this._list = this.shadowRoot.querySelector(".file-list");
        this._liveRegion = this.shadowRoot.querySelector(".sr-only");
    }

    _rejectReason(file, count, total) {
        if (!this._matchesAccept(file)) return "accept";
        if (this.maxSize != null && file.size > this.maxSize) return "max-size";
        if (this.multiple && this.maxFiles != null && count + 1 > this.maxFiles) {
            return "max-files";
        }
        if (this.maxTotalSize != null && total + file.size > this.maxTotalSize) {
            return "max-total-size";
        }
        return null;
    }

    _renderList() {
        this._rows.clear();
        if (!this._list) return;
        this._list.replaceChildren();
        this._list.style.display = this.showList ? "" : "none";
        if (!this.showList) return;

        for (const file of this._files) {
            this._list.appendChild(this._buildRow(file));
            this._applyRowState(file);
        }
    }

    _replaceFiles(next) {
        const nextSet = new Set(next);
        for (const file of this._files) {
            if (!nextSet.has(file)) this._forgetFile(file);
        }
        this._files = next;
        this._syncFormValue();
        this._updateValidity();
        this._renderList();
    }

    _requestRemove(file) {
        if (this.disabled) return;
        const event = new CustomEvent("remove", {
            detail: { file },
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        if (!this.dispatchEvent(event)) return;

        const next = this._files.filter((f) => f !== file);
        this._replaceFiles(next);
        this._announce(`${file.name} removed.`);
        this._emitChange();
    }

    _revokeAllUrls() {
        for (const url of this._urls.values()) URL.revokeObjectURL(url);
        this._urls.clear();
    }

    _setNumberAttr(attr, val) {
        if (val == null || val === "") this.removeAttribute(attr);
        else this.setAttribute(attr, String(val));
    }

    _syncFormValue() {
        const name = this.getAttribute("name");
        if (!name) {
            this._internals.setFormValue(null);
            return;
        }
        const data = new FormData();
        for (const file of this._files) data.append(name, file);
        this._internals.setFormValue(data);
    }

    _updateValidity() {
        if (this.required && this._files.length === 0) {
            this._internals.setValidity(
                { valueMissing: true },
                "Please select a file.",
                this._dropzone || undefined,
            );
        } else {
            this._internals.setValidity({});
        }
    }

    _urlFor(file) {
        let url = this._urls.get(file);
        if (!url) {
            url = URL.createObjectURL(file);
            this._urls.set(file, url);
        }
        return url;
    }

    _wireEvents() {
        if (this.disabled) return;

        this._input.addEventListener("change", (e) => {
            this._handleFiles(e.target.files);
            e.target.value = "";
        });

        this._dropzone.addEventListener("click", () => this.browse());
        this._dropzone.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this.browse();
            }
        });

        this._dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.setAttribute("dragover", "");
        });
        this._dropzone.addEventListener("dragleave", (e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                this.removeAttribute("dragover");
            }
        });
        this._dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            this.removeAttribute("dragover");
            const { files, rejections } = this._extractDropped(e.dataTransfer);
            this._handleFiles(files, rejections);
        });
    }
}

if (!customElements.get("y-upload")) {
    customElements.define("y-upload", YumeUpload);
}
