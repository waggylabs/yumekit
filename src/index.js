import variablesCSS from "../styles/variables.css";

if (
    typeof document !== "undefined" &&
    !document.querySelector("[data-yumekit-vars]")
) {
    const style = document.createElement("style");
    style.setAttribute("data-yumekit-vars", "");
    style.textContent = variablesCSS;
    document.head.appendChild(style);
}

export * from "./components/y-appbar.js";
export * from "./components/y-avatar.js";
export * from "./components/y-badge.js";
export * from "./components/y-button.js";
export * from "./components/y-card.js";
export * from "./components/y-checkbox.js";
export * from "./components/y-dialog.js";
export * from "./components/y-drawer.js";
export * from "./components/y-icon.js";
export { registerIcon, registerIcons, getIcon } from "./icons/registry.js";
export * from "./components/y-input.js";
export * from "./components/y-menu.js";
export * from "./components/y-panel.js";
export * from "./components/y-panelbar.js";
export * from "./components/y-progress.js";
export * from "./components/y-radio.js";
export * from "./components/y-select.js";
export * from "./components/y-slider.js";
export * from "./components/y-switch.js";
export * from "./components/y-table.js";
export * from "./components/y-tag.js";
export * from "./components/y-tabs.js";
export * from "./components/y-toast.js";
export * from "./components/y-tooltip.js";
export * from "./components/y-theme.js";
