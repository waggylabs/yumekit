import type { DetailedHTMLProps, HTMLAttributes } from "react";

type El<T = object> = DetailedHTMLProps<
    HTMLAttributes<HTMLElement>,
    HTMLElement
> &
    T;

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "y-appbar": El<{
                orientation?: "vertical" | "horizontal";
                collapsed?: boolean | string;
                items?: string;
                size?: "small" | "medium" | "large";
                "menu-direction"?: "right" | "down" | "";
                sticky?: "start" | "end";
            }>;
            "y-avatar": El<{
                src?: string;
                alt?: string;
                size?: "small" | "medium" | "large";
                shape?: string;
            }>;
            "y-badge": El<{
                value?: string;
                position?: "top" | "bottom";
                alignment?: "right" | "left";
                color?: string;
                size?: "small" | "medium" | "large";
            }>;
            "y-button": El<{
                "left-icon"?: string;
                "right-icon"?: string;
                color?: string;
                size?: "small" | "medium" | "large";
                "style-type"?: "outlined" | "filled" | "flat";
                type?: string;
                disabled?: boolean | string;
                name?: string;
                value?: string;
                autofocus?: boolean | string;
                form?: string;
                formaction?: string;
                formenctype?: string;
                formmethod?: string;
                formnovalidate?: boolean | string;
                formtarget?: string;
                "aria-label"?: string;
                "aria-pressed"?: string;
                "aria-hidden"?: string;
            }>;
            "y-card": El<{
                color?: string;
                raised?: boolean | string;
            }>;
            "y-checkbox": El<{
                name?: string;
                value?: string;
                checked?: boolean | string;
                disabled?: boolean | string;
                indeterminate?: boolean | string;
                "label-position"?: "top" | "bottom" | "left" | "right";
                color?: string;
                size?: string;
            }>;
            "y-dialog": El<{
                visible?: boolean | string;
                anchor?: string;
                closable?: boolean | string;
            }>;
            "y-drawer": El<{
                visible?: boolean | string;
                anchor?: string;
                position?: "left" | "right" | "top" | "bottom";
                resizable?: boolean | string;
            }>;
            "y-icon": El<{
                name?: string;
                size?: "small" | "medium" | "large";
                color?: string;
                label?: string;
                weight?: "thin" | "regular" | "thick";
            }>;
            "y-input": El<{
                type?: string;
                name?: string;
                value?: string;
                placeholder?: string;
                disabled?: boolean | string;
                invalid?: boolean | string;
                required?: boolean | string;
                color?: string;
                size?: "small" | "medium" | "large";
                label?: string;
                "label-position"?: string;
            }>;
            "y-menu": El<{
                items?: string;
                anchor?: string;
                visible?: boolean | string;
                direction?: "down" | "up" | "left" | "right";
                size?: "small" | "medium" | "large";
            }>;
            "y-panel": El<{
                selected?: boolean | string;
                expanded?: boolean | string;
                href?: string;
                history?: string;
            }>;
            "y-panelbar": El<{
                exclusive?: boolean | string;
            }>;
            "y-progress": El<{
                value?: string | number;
                min?: string | number;
                max?: string | number;
                step?: string | number;
                color?: string;
                size?: "small" | "medium" | "large";
                "label-display"?: boolean | string;
                "label-format"?: "percent" | "value" | "fraction";
                indeterminate?: boolean | string;
                disabled?: boolean | string;
            }>;
            "y-radio": El<{
                name?: string;
                value?: string;
                options?: string;
                disabled?: boolean | string;
                color?: string;
                size?: string;
            }>;
            "y-select": El<{
                name?: string;
                value?: string;
                disabled?: boolean | string;
                multiple?: boolean | string;
                color?: string;
                size?: string;
                placeholder?: string;
                options?: string;
                invalid?: boolean | string;
                required?: boolean | string;
                "label-position"?: string;
                "display-mode"?: string;
                "close-on-click-outside"?: string;
            }>;
            "y-slider": El<{
                name?: string;
                value?: string | number;
                min?: string | number;
                max?: string | number;
                step?: string | number;
                disabled?: boolean | string;
                color?: string;
                size?: "small" | "medium" | "large";
                orientation?: "horizontal" | "vertical";
            }>;
            "y-switch": El<{
                name?: string;
                value?: string;
                checked?: boolean | string;
                disabled?: boolean | string;
                animate?: string;
                "toggle-label"?: boolean | string;
                "label-display"?: string;
                "label-position"?: "top" | "bottom" | "left" | "right";
                color?: string;
                size?: "small" | "medium" | "large";
            }>;
            "y-table": El<{
                columns?: string;
                data?: string;
                striped?: boolean | string;
                size?: "small" | "medium" | "large";
            }>;
            "y-tabs": El<{
                options?: string;
                size?: "small" | "medium" | "large";
                position?: "top" | "bottom" | "left" | "right";
            }>;
            "y-tag": El<{
                color?: string;
                size?: "small" | "medium" | "large";
                removable?: boolean | string;
                "style-type"?: "filled" | "outlined" | "flat";
                shape?: "square" | "round";
            }>;
            "y-theme": El<{
                theme?: string;
                mode?: "light" | "dark";
                "theme-path"?: string;
            }>;
            "y-toast": El<{
                position?:
                    | "top-right"
                    | "top-left"
                    | "top-center"
                    | "bottom-right"
                    | "bottom-left"
                    | "bottom-center";
                duration?: string | number;
                max?: string | number;
            }>;
            "y-tooltip": El<{
                text?: string;
                position?: "top" | "bottom" | "left" | "right";
                color?: string;
                delay?: string | number;
            }>;
        }
    }
}
