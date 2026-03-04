/**
 * Registers all bundled icons into the icon registry.
 *
 * Import this module as a side-effect to make every icon available to <y-icon>:
 *
 *   import "@studious-creative/yumekit/icons/all.js";
 */

import { registerIcons } from "./registry.js";

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
import compass from "./compass.svg";
import diagram from "./diagram.svg";
import discord from "./discord.svg";
import expandRight from "./expand-right.svg";
import features from "./features.svg";
import figma from "./figma.svg";
import filter from "./filter.svg";
import folder from "./folder.svg";
import github from "./github.svg";
import home from "./home.svg";
import image from "./image.svg";
import indeterminate from "./indeterminate.svg";
import layout from "./layout.svg";
import listCheck from "./list-check.svg";
import logo from "./logo.svg";
import mail from "./mail.svg";
import moon from "./moon.svg";
import palette from "./palette.svg";
import plus from "./plus.svg";
import save from "./save.svg";
import search from "./search.svg";
import settings from "./settings.svg";
import star from "./star.svg";
import sun from "./sun.svg";
import user from "./user.svg";
import users from "./users.svg";
import warning from "./warning.svg";

registerIcons({
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
    compass,
    diagram,
    discord,
    "expand-right": expandRight,
    features,
    figma,
    filter,
    folder,
    github,
    home,
    image,
    indeterminate,
    layout,
    "list-check": listCheck,
    logo,
    mail,
    moon,
    palette,
    plus,
    save,
    search,
    settings,
    star,
    sun,
    user,
    users,
    warning,
});
