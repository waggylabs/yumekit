/**
 * Registers all bundled icons into the icon registry.
 *
 * Import this module as a side-effect to make every icon available to <y-icon>:
 *
 *   import "@waggylabs/yumekit/icons/all.js";
 *
 * This also pulls in the filled variants (registered under `<name>-fill`), so
 * `<y-icon weight="filled">` works for every icon that has a filled version.
 */

import { registerIcons } from "./registry.js";
import "./all-filled.js";

import accessibility from "./accessibility.svg";
import robot from "./robot.svg";
import archive from "./archive.svg";
import arrowDown from "./arrow-down.svg";
import arrowLeft from "./arrow-left.svg";
import arrowRight from "./arrow-right.svg";
import arrowUp from "./arrow-up.svg";
import bug from "./bug.svg";
import circleSlash from "./circle-slash.svg";
import bell from "./bell.svg";
import bluetooth from "./bluetooth.svg";
import briefcase from "./briefcase.svg";
import bolt from "./bolt.svg";
import bookmark from "./bookmark.svg";
import calendar from "./calendar.svg";
import campfire from "./campfire.svg";
import waveform from "./waveform.svg";
import check from "./check.svg";
import chevronDown from "./chevron-down.svg";
import chevronLeft from "./chevron-left.svg";
import chevronRight from "./chevron-right.svg";
import chevronUp from "./chevron-up.svg";
import circleExclamation from "./circle-exclamation.svg";
import circleInfo from "./circle-info.svg";
import circleQuestion from "./circle-question.svg";
import clock from "./clock.svg";
import xIcon from "./x.svg";
import cloud from "./cloud.svg";
import code from "./code.svg";
import speechBubble from "./speech-bubble.svg";
import appbar from "./appbar.svg";
import avatar from "./avatar.svg";
import badge from "./badge.svg";
import button from "./button.svg";
import card from "./card.svg";
import checkbox from "./checkbox.svg";
import date from "./date.svg";
import dialog from "./dialog.svg";
import drawer from "./drawer.svg";
import icon from "./icon.svg";
import input from "./input.svg";
import droplist from "./droplist.svg";
import panelbar from "./panelbar.svg";
import progress from "./progress.svg";
import radio from "./radio.svg";
import select from "./select.svg";
import slider from "./slider.svg";
import switchIcon from "./switch.svg";
import tableIcon from "./table.svg";
import tabs from "./tabs.svg";
import chip from "./chip.svg";
import theme from "./theme.svg";
import toast from "./toast.svg";
import tooltip from "./tooltip.svg";
import textarea from "./textarea.svg";
import rating from "./rating.svg";
import compass from "./compass.svg";
import copy from "./copy.svg";
import diagram from "./diagram.svg";
import discord from "./discord.svg";
import downFromBracket from "./down-from-bracket.svg";
import downToBracket from "./down-to-bracket.svg";
import ellipsisH from "./ellipsis-h.svg";
import ellipsisV from "./ellipsis-v.svg";
import evCharger from "./ev-charger.svg";
import expandDown from "./expand-down.svg";
import expandLeft from "./expand-left.svg";
import expandRight from "./expand-right.svg";
import expandUp from "./expand-up.svg";
import faceSmile from "./face-smile.svg";
import faceNeutral from "./face-neutral.svg";
import faceFrown from "./face-frown.svg";
import fan from "./fan.svg";
import fastBack from "./fast-back.svg";
import fastForward from "./fast-forward.svg";
import flower from "./flower.svg";
import figma from "./figma.svg";
import funnel from "./funnel.svg";
import flask from "./flask.svg";
import gasoline from "./gasoline.svg";
import folder from "./folder.svg";
import github from "./github.svg";
import heart from "./heart.svg";
import globe from "./globe.svg";
import grid from "./grid.svg";
import home from "./home.svg";
import image from "./image.svg";
import layout from "./layout.svg";
import leftFromBracket from "./left-from-bracket.svg";
import leftToBracket from "./left-to-bracket.svg";
import link from "./link.svg";
import listBullet from "./list-bullet.svg";
import listCheck from "./list-check.svg";
import lock from "./lock.svg";
import mail from "./mail.svg";
import mapMarker from "./map-marker.svg";
import menuIcon from "./menu.svg";
import minus from "./minus.svg";
import monitor from "./monitor.svg";
import moon from "./moon.svg";
import palette from "./palette.svg";
import clipboard from "./clipboard.svg";
import pause from "./pause.svg";
import pencil from "./pencil.svg";
import paperAirplane from "./paper-airplane.svg";
import play from "./play.svg";
import plug from "./plug.svg";
import plus from "./plus.svg";
import puzzle from "./puzzle.svg";
import redo from "./redo.svg";
import rightFromBracket from "./right-from-bracket.svg";
import rightToBracket from "./right-to-bracket.svg";
import floppyDisk from "./floppy-disk.svg";
import scissors from "./scissors.svg";
import magnifyingGlass from "./magnifying-glass.svg";
import gear from "./gear.svg";
import share from "./share.svg";
import shield from "./shield.svg";
import skipBack from "./skip-back.svg";
import skipForward from "./skip-forward.svg";
import smartphone from "./smartphone.svg";
import stack from "./stack.svg";
import stop from "./stop.svg";
import star from "./star.svg";
import thumbsDown from "./thumbs-down.svg";
import thumbsUp from "./thumbs-up.svg";
import thumbtack from "./thumbtack.svg";
import sun from "./sun.svg";
import swap from "./swap.svg";
import tablet from "./tablet.svg";
import tag from "./tag.svg";
import thermometerHigh from "./thermometer-high.svg";
import thermometerLow from "./thermometer-low.svg";
import wrench from "./wrench.svg";
import trash from "./trash.svg";
import undo from "./undo.svg";
import unlock from "./unlock.svg";
import upFromBracket from "./up-from-bracket.svg";
import upToBracket from "./up-to-bracket.svg";
import user from "./user.svg";
import users from "./users.svg";
import triangleExclamation from "./triangle-exclamation.svg";

registerIcons({
    accessibility,
    robot,
    archive,
    "arrow-down": arrowDown,
    "arrow-left": arrowLeft,
    "arrow-right": arrowRight,
    "arrow-up": arrowUp,
    bug,
    "circle-slash": circleSlash,
    bell,
    bluetooth,
    bolt,
    briefcase,
    bookmark,
    calendar,
    campfire,
    waveform,
    check,
    "circle-exclamation": circleExclamation,
    "circle-info": circleInfo,
    "circle-question": circleQuestion,
    "chevron-down": chevronDown,
    "chevron-left": chevronLeft,
    "chevron-right": chevronRight,
    "chevron-up": chevronUp,
    clock,
    x: xIcon,
    cloud,
    code,
    "speech-bubble": speechBubble,
    appbar,
    avatar,
    badge,
    button,
    card,
    checkbox,
    date,
    dialog,
    drawer,
    icon,
    input,
    droplist,
    panelbar,
    progress,
    radio,
    rating,
    select,
    slider,
    switch: switchIcon,
    table: tableIcon,
    tabs,
    chip,
    theme,
    toast,
    tooltip,
    textarea,
    compass,
    copy,
    diagram,
    discord,
    "down-from-bracket": downFromBracket,
    "down-to-bracket": downToBracket,
    "ellipsis-h": ellipsisH,
    "ellipsis-v": ellipsisV,
    "ev-charger": evCharger,
    "expand-down": expandDown,
    "expand-left": expandLeft,
    "expand-right": expandRight,
    "expand-up": expandUp,
    "face-frown": faceFrown,
    "face-neutral": faceNeutral,
    "face-smile": faceSmile,
    fan,
    "fast-back": fastBack,
    "fast-forward": fastForward,
    flower,
    figma,
    funnel,
    flask,
    folder,
    gasoline,

    github,
    globe,
    heart,
    grid,
    home,
    image,
    layout,
    "left-from-bracket": leftFromBracket,
    "left-to-bracket": leftToBracket,
    link,
    "list-bullet": listBullet,
    "list-check": listCheck,
    lock,
    mail,
    "map-marker": mapMarker,
    menu: menuIcon,
    minus,
    monitor,
    moon,
    palette,
    clipboard,
    pause,
    "paper-airplane": paperAirplane,
    pencil,
    play,
    plug,
    plus,
    puzzle,
    redo,
    "right-from-bracket": rightFromBracket,
    "right-to-bracket": rightToBracket,
    "floppy-disk": floppyDisk,
    scissors,
    "magnifying-glass": magnifyingGlass,
    gear,
    share,
    shield,
    "skip-back": skipBack,
    "skip-forward": skipForward,
    smartphone,
    stack,
    star,
    stop,
    sun,
    "thumbs-down": thumbsDown,
    "thumbs-up": thumbsUp,
    thumbtack,
    swap,
    tablet,
    tag,
    "thermometer-high": thermometerHigh,
    "thermometer-low": thermometerLow,
    wrench,
    trash,
    undo,
    unlock,
    "up-from-bracket": upFromBracket,
    "up-to-bracket": upToBracket,
    user,
    users,
    "triangle-exclamation": triangleExclamation,
});
