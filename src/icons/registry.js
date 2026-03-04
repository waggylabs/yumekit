/**
 * Icon registry — maps icon names to their SVG markup strings.
 *
 * Each SVG file in this directory is imported as a raw string (via the
 * Rollup svgString plugin) and keyed by its filename (minus extension).
 */

import ai from "./ai.svg";
import arrowRight from "./arrow-right.svg";
import bolt from "./bolt.svg";
import chart from "./chart.svg";
import checkmark from "./checkmark.svg";
import chevronDown from "./chevron-down.svg";
import chevronDownLg from "./chevron-down-lg.svg";
import chevronRight from "./chevron-right.svg";
import close from "./close.svg";
import collapseLeft from "./collapse-left.svg";
import discord from "./discord.svg";
import expandRight from "./expand-right.svg";
import features from "./features.svg";
import figma from "./figma.svg";
import folder from "./folder.svg";
import github from "./github.svg";
import home from "./home.svg";
import image from "./image.svg";
import indeterminate from "./indeterminate.svg";
import layout from "./layout.svg";
import logo from "./logo.svg";
import mail from "./mail.svg";
import moon from "./moon.svg";
import palette from "./palette.svg";
import search from "./search.svg";
import settings from "./settings.svg";
import star from "./star.svg";
import sun from "./sun.svg";
import user from "./user.svg";

export const icons = {
    ai,
    "arrow-right": arrowRight,
    bolt,
    chart,
    checkmark,
    "chevron-down": chevronDown,
    "chevron-down-lg": chevronDownLg,
    "chevron-right": chevronRight,
    close,
    "collapse-left": collapseLeft,
    discord,
    "expand-right": expandRight,
    features,
    figma,
    folder,
    github,
    home,
    image,
    indeterminate,
    layout,
    logo,
    mail,
    moon,
    palette,
    search,
    settings,
    star,
    sun,
    user,
};
