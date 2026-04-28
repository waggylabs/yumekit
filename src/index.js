import variablesCSS from "../styles/variables.css";
import "./icons/all.js";

if (
    typeof document !== "undefined" &&
    !document.querySelector("[data-yumekit-vars]")
) {
    const style = document.createElement("style");
    style.setAttribute("data-yumekit-vars", "");
    style.textContent = variablesCSS;
    document.head.appendChild(style);
}

export * from "./components/y-appbar/y-appbar.js";
export * from "./components/y-avatar/y-avatar.js";
export * from "./components/y-banner/y-banner.js";
export * from "./components/y-badge/y-badge.js";
export * from "./components/y-break/y-break.js";
export * from "./components/y-breadcrumbs/y-breadcrumbs.js";
export * from "./components/y-button/y-button.js";
export * from "./components/y-button-group/y-button-group.js";
export * from "./components/y-card/y-card.js";
export * from "./components/y-checkbox/y-checkbox.js";
export * from "./components/y-color/y-color.js";
export * from "./components/y-colorpicker/y-colorpicker.js";
export * from "./components/y-date/y-date.js";
export * from "./components/y-datepicker/y-datepicker.js";
export * from "./components/y-dialog/y-dialog.js";
export * from "./components/y-drawer/y-drawer.js";
export * from "./components/y-droplist/y-droplist.js";
export * from "./components/y-dock/y-dock.js";
export * from "./components/y-gallery/y-gallery.js";
export * from "./components/y-grid/y-grid.js";
export * from "./components/y-icon/y-icon.js";
export { registerIcon, registerIcons, getIcon } from "./icons/registry.js";
export * from "./components/y-input/y-input.js";
export * from "./components/y-textarea/y-textarea.js";
export * from "./components/y-masonry/y-masonry.js";
export * from "./components/y-menu/y-menu.js";
export * from "./components/y-panel/y-panel.js";
export * from "./components/y-panelbar/y-panelbar.js";
export * from "./components/y-progress/y-progress.js";
export * from "./components/y-rating/y-rating.js";
export * from "./components/y-radio/y-radio.js";
export * from "./components/y-select/y-select.js";
export * from "./components/y-slider/y-slider.js";
export * from "./components/y-splitter/y-splitter.js";
export * from "./components/y-stack/y-stack.js";
export * from "./components/y-stepper/y-stepper.js";
export * from "./components/y-switch/y-switch.js";
export * from "./components/y-table/y-table.js";
export * from "./components/y-tag/y-tag.js";
export * from "./components/y-tabs/y-tabs.js";
export * from "./components/y-toast/y-toast.js";
export * from "./components/y-tooltip/y-tooltip.js";
export * from "./components/y-theme/y-theme.js";
