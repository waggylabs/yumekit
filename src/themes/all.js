/**
 * Registers all bundled themes into the theme registry.
 *
 * Import this module as a side-effect to make every built-in theme available
 * to <y-theme>:
 *
 *   import "@waggylabs/yumekit/themes/all.js";
 *
 * The umbrella entry (`@waggylabs/yumekit`) already does this. Import
 * `components/y-theme.js` directly and register only the themes you need to
 * avoid shipping every theme's CSS.
 *
 * Each entry carries its own Google Fonts `family=` query; `font: null` means
 * the theme uses a native system-font stack and needs no webfont download.
 * Entries with no `font` key use the registry default.
 */

import { registerThemes } from "./registry.js";

import blueLightCSS from "../../styles/blue-light.css";
import blueDarkCSS from "../../styles/blue-dark.css";
import slateLightCSS from "../../styles/slate-light.css";
import slateDarkCSS from "../../styles/slate-dark.css";
import monoLightCSS from "../../styles/mono-light.css";
import monoDarkCSS from "../../styles/mono-dark.css";
import orangeLightCSS from "../../styles/orange-light.css";
import orangeDarkCSS from "../../styles/orange-dark.css";
import greenLightCSS from "../../styles/green-light.css";
import greenDarkCSS from "../../styles/green-dark.css";
import redLightCSS from "../../styles/red-light.css";
import redDarkCSS from "../../styles/red-dark.css";
import tealLightCSS from "../../styles/teal-light.css";
import tealDarkCSS from "../../styles/teal-dark.css";
import yellowLightCSS from "../../styles/yellow-light.css";
import yellowDarkCSS from "../../styles/yellow-dark.css";
import indigoLightCSS from "../../styles/indigo-light.css";
import indigoDarkCSS from "../../styles/indigo-dark.css";
import purpleLightCSS from "../../styles/purple-light.css";
import purpleDarkCSS from "../../styles/purple-dark.css";
import pinkLightCSS from "../../styles/pink-light.css";
import pinkDarkCSS from "../../styles/pink-dark.css";
import roseLightCSS from "../../styles/rose-light.css";
import roseDarkCSS from "../../styles/rose-dark.css";
import brownLightCSS from "../../styles/brown-light.css";
import brownDarkCSS from "../../styles/brown-dark.css";
import oliveLightCSS from "../../styles/olive-light.css";
import oliveDarkCSS from "../../styles/olive-dark.css";
import materialBlueLightCSS from "../../styles/material-blue-light.css";
import materialBlueDarkCSS from "../../styles/material-blue-dark.css";
import materialPurpleLightCSS from "../../styles/material-purple-light.css";
import materialPurpleDarkCSS from "../../styles/material-purple-dark.css";
import carbonLightCSS from "../../styles/carbon-light.css";
import carbonDarkCSS from "../../styles/carbon-dark.css";
import antBlueLightCSS from "../../styles/ant-blue-light.css";
import antBlueDarkCSS from "../../styles/ant-blue-dark.css";
import antGreenLightCSS from "../../styles/ant-green-light.css";
import antGreenDarkCSS from "../../styles/ant-green-dark.css";
import shadcnLightCSS from "../../styles/shadcn-light.css";
import shadcnDarkCSS from "../../styles/shadcn-dark.css";
import shadcnBlueLightCSS from "../../styles/shadcn-blue-light.css";
import shadcnBlueDarkCSS from "../../styles/shadcn-blue-dark.css";
import primerLightCSS from "../../styles/primer-light.css";
import primerDarkCSS from "../../styles/primer-dark.css";
import primerDarkDimmedCSS from "../../styles/primer-dark-dimmed.css";
import bootstrapLightCSS from "../../styles/bootstrap-light.css";
import bootstrapDarkCSS from "../../styles/bootstrap-dark.css";
import catppuccinLatteCSS from "../../styles/catppuccin-latte.css";
import catppuccinFrappeCSS from "../../styles/catppuccin-frappe.css";
import catppuccinMacchiatoCSS from "../../styles/catppuccin-macchiato.css";
import catppuccinMochaCSS from "../../styles/catppuccin-mocha.css";
import nordCSS from "../../styles/nord.css";
import nordAuroraCSS from "../../styles/nord-aurora.css";
import waggyCSS from "../../styles/waggy.css";
import waggyDarkCSS from "../../styles/waggy-dark.css";
import keplerLightCSS from "../../styles/kepler-light.css";
import keplerDarkCSS from "../../styles/kepler-dark.css";
import keplerAmberCSS from "../../styles/kepler-amber.css";
import keplerGalaxyCSS from "../../styles/kepler-galaxy.css";
import keplerMatrixCSS from "../../styles/kepler-matrix.css";

registerThemes({
    "blue-light": blueLightCSS,
    "blue-dark": blueDarkCSS,
    "slate-light": slateLightCSS,
    "slate-dark": slateDarkCSS,
    "mono-light": monoLightCSS,
    "mono-dark": monoDarkCSS,
    "orange-light": orangeLightCSS,
    "orange-dark": orangeDarkCSS,
    "green-light": greenLightCSS,
    "green-dark": greenDarkCSS,
    "red-light": redLightCSS,
    "red-dark": redDarkCSS,
    "teal-light": tealLightCSS,
    "teal-dark": tealDarkCSS,
    "yellow-light": yellowLightCSS,
    "yellow-dark": yellowDarkCSS,
    "indigo-light": indigoLightCSS,
    "indigo-dark": indigoDarkCSS,
    "purple-light": purpleLightCSS,
    "purple-dark": purpleDarkCSS,
    "pink-light": pinkLightCSS,
    "pink-dark": pinkDarkCSS,
    "rose-light": roseLightCSS,
    "rose-dark": roseDarkCSS,
    "brown-light": brownLightCSS,
    "brown-dark": brownDarkCSS,
    "olive-light": oliveLightCSS,
    "olive-dark": oliveDarkCSS,
    "material-blue-light": { css: materialBlueLightCSS, font: "Roboto:wght@300;400;500;700" },
    "material-blue-dark": { css: materialBlueDarkCSS, font: "Roboto:wght@300;400;500;700" },
    "material-purple-light": { css: materialPurpleLightCSS, font: "Roboto:wght@300;400;500;700" },
    "material-purple-dark": { css: materialPurpleDarkCSS, font: "Roboto:wght@300;400;500;700" },
    "carbon-light": { css: carbonLightCSS, font: "IBM+Plex+Sans:wght@400;500;600;700" },
    "carbon-dark": { css: carbonDarkCSS, font: "IBM+Plex+Sans:wght@400;500;600;700" },
    "ant-blue-light": { css: antBlueLightCSS, font: null },
    "ant-blue-dark": { css: antBlueDarkCSS, font: null },
    "ant-green-light": { css: antGreenLightCSS, font: null },
    "ant-green-dark": { css: antGreenDarkCSS, font: null },
    "shadcn-light": { css: shadcnLightCSS, font: "Inter:wght@400;500;600;700" },
    "shadcn-dark": { css: shadcnDarkCSS, font: "Inter:wght@400;500;600;700" },
    "shadcn-blue-light": { css: shadcnBlueLightCSS, font: "Inter:wght@400;500;600;700" },
    "shadcn-blue-dark": { css: shadcnBlueDarkCSS, font: "Inter:wght@400;500;600;700" },
    "primer-light": { css: primerLightCSS, font: null },
    "primer-dark": { css: primerDarkCSS, font: null },
    "primer-dark-dimmed": { css: primerDarkDimmedCSS, font: null },
    "bootstrap-light": { css: bootstrapLightCSS, font: null },
    "bootstrap-dark": { css: bootstrapDarkCSS, font: null },
    "catppuccin-latte": catppuccinLatteCSS,
    "catppuccin-frappe": catppuccinFrappeCSS,
    "catppuccin-macchiato": catppuccinMacchiatoCSS,
    "catppuccin-mocha": catppuccinMochaCSS,
    "nord": nordCSS,
    "nord-aurora": nordAuroraCSS,
    "waggy": { css: waggyCSS, font: null },
    "waggy-dark": { css: waggyDarkCSS, font: null },
    "kepler-light": { css: keplerLightCSS, font: "Tomorrow:wght@300;400;500;600;700" },
    "kepler-dark": { css: keplerDarkCSS, font: "Tomorrow:wght@300;400;500;600;700" },
    "kepler-amber": { css: keplerAmberCSS, font: "Tomorrow:wght@300;400;500;600;700" },
    "kepler-galaxy": { css: keplerGalaxyCSS, font: "Tomorrow:wght@300;400;500;600;700" },
    "kepler-matrix": { css: keplerMatrixCSS, font: "Tomorrow:wght@300;400;500;600;700" },
});
