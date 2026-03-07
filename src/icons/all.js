/**
 * Registers all bundled icons into the icon registry.
 *
 * Import this module as a side-effect to make every icon available to <y-icon>:
 *
 *   import "@waggylabs/yumekit/icons/all.js";
 */

import { registerIcons } from "./registry.js";

import accessibility from "./accessibility.svg";
import ai from "./ai.svg";
import arrowRight from "./arrow-right.svg";
import arrowUp from "./arrow-up.svg";
import bell from "./bell.svg";
import bolt from "./bolt.svg";
import calendar from "./calendar.svg";
import chart from "./chart.svg";
import checkmark from "./checkmark.svg";
import chevronDown from "./chevron-down.svg";
import chevronDownLg from "./chevron-down-lg.svg";
import chevronRight from "./chevron-right.svg";
import clock from "./clock.svg";
import close from "./close.svg";
import collapseLeft from "./collapse-left.svg";
import comments from "./comments.svg";
import compAppbar from "./comp-appbar.svg";
import compAvatar from "./comp-avatar.svg";
import compBadge from "./comp-badge.svg";
import compButton from "./comp-button.svg";
import compCard from "./comp-card.svg";
import compCheckbox from "./comp-checkbox.svg";
import compDialog from "./comp-dialog.svg";
import compDrawer from "./comp-drawer.svg";
import compIcon from "./comp-icon.svg";
import compInput from "./comp-input.svg";
import compMenu from "./comp-menu.svg";
import compPanelbar from "./comp-panelbar.svg";
import compProgress from "./comp-progress.svg";
import compRadio from "./comp-radio.svg";
import compSelect from "./comp-select.svg";
import compSlider from "./comp-slider.svg";
import compSwitch from "./comp-switch.svg";
import compTable from "./comp-table.svg";
import compTabs from "./comp-tabs.svg";
import compTag from "./comp-tag.svg";
import compTheme from "./comp-theme.svg";
import compToast from "./comp-toast.svg";
import compTooltip from "./comp-tooltip.svg";
import compass from "./compass.svg";
import diagram from "./diagram.svg";
import discord from "./discord.svg";
import download from "./download.svg";
import expandRight from "./expand-right.svg";
import features from "./features.svg";
import figma from "./figma.svg";
import filter from "./filter.svg";
import folder from "./folder.svg";
import github from "./github.svg";
import globe from "./globe.svg";
import grid from "./grid.svg";
import home from "./home.svg";
import image from "./image.svg";
import indeterminate from "./indeterminate.svg";
import layout from "./layout.svg";
import leftFromBracket from "./left-from-bracket.svg";
import leftToBracket from "./left-to-bracket.svg";
import listCheck from "./list-check.svg";
import lock from "./lock.svg";
import logo from "./logo.svg";
import mail from "./mail.svg";
import moon from "./moon.svg";
import palette from "./palette.svg";
import plus from "./plus.svg";
import puzzle from "./puzzle.svg";
import rightFromBracket from "./right-from-bracket.svg";
import rightToBracket from "./right-to-bracket.svg";
import save from "./save.svg";
import search from "./search.svg";
import settings from "./settings.svg";
import shield from "./shield.svg";
import star from "./star.svg";
import sun from "./sun.svg";
import swap from "./swap.svg";
import upload from "./upload.svg";
import user from "./user.svg";
import users from "./users.svg";
import warning from "./warning.svg";

registerIcons({
    accessibility,
    ai,
    "arrow-right": arrowRight,
    "arrow-up": arrowUp,
    bell,
    bolt,
    calendar,
    chart,
    checkmark,
    "chevron-down": chevronDown,
    "chevron-down-lg": chevronDownLg,
    "chevron-right": chevronRight,
    clock,
    close,
    "collapse-left": collapseLeft,
    comments,
    "comp-appbar": compAppbar,
    "comp-avatar": compAvatar,
    "comp-badge": compBadge,
    "comp-button": compButton,
    "comp-card": compCard,
    "comp-checkbox": compCheckbox,
    "comp-dialog": compDialog,
    "comp-drawer": compDrawer,
    "comp-icon": compIcon,
    "comp-input": compInput,
    "comp-menu": compMenu,
    "comp-panelbar": compPanelbar,
    "comp-progress": compProgress,
    "comp-radio": compRadio,
    "comp-select": compSelect,
    "comp-slider": compSlider,
    "comp-switch": compSwitch,
    "comp-table": compTable,
    "comp-tabs": compTabs,
    "comp-tag": compTag,
    "comp-theme": compTheme,
    "comp-toast": compToast,
    "comp-tooltip": compTooltip,
    compass,
    diagram,
    discord,
    download,
    "expand-right": expandRight,
    features,
    figma,
    filter,
    folder,
    github,
    globe,
    grid,
    home,
    image,
    indeterminate,
    layout,
    "left-from-bracket": leftFromBracket,
    "left-to-bracket": leftToBracket,
    "list-check": listCheck,
    lock,
    logo,
    mail,
    moon,
    palette,
    plus,
    puzzle,
    "right-from-bracket": rightFromBracket,
    "right-to-bracket": rightToBracket,
    save,
    search,
    settings,
    shield,
    star,
    sun,
    swap,
    upload,
    user,
    users,
    warning,
});
