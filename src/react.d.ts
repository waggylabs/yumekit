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
                items?: unknown[] | string;
                size?: "small" | "medium" | "large";
                "menu-direction"?: "right" | "down" | "";
                sticky?: "start" | "end";
                "mobile-breakpoint"?: string | number;
            }>;
            "y-avatar": El<{
                src?: string;
                alt?: string;
                size?: "small" | "medium" | "large";
                shape?: string;
                color?: string;
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
            "y-button-group": El<{
                orientation?: "horizontal" | "vertical";
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
            }>;
            "y-date": El<{
                name?: string;
                value?: string;
                min?: string;
                max?: string;
                format?: string;
                placeholder?: string;
                mode?: "single" | "range";
                size?: "small" | "medium" | "large";
                color?: string;
                disabled?: boolean | string;
                invalid?: boolean | string;
                clearable?: boolean | string;
                "label-position"?: "top" | "bottom";
                "show-hours"?: boolean | string;
                "show-minutes"?: boolean | string;
                "show-seconds"?: boolean | string;
                "show-years"?: string;
                "show-months"?: string;
                "show-days"?: string;
            }>;
            "y-datepicker": El<{
                value?: string;
                min?: string;
                max?: string;
                format?: string;
                mode?: "single" | "range";
                color?: string;
                "show-hours"?: boolean | string;
                "show-minutes"?: boolean | string;
                "show-seconds"?: boolean | string;
                "show-years"?: string;
                "show-months"?: string;
                "show-days"?: string;
            }>;
            "y-dialog": El<{
                visible?: boolean | string;
                anchor?: string;
                closable?: boolean | string;
                "show-backdrop"?: boolean | string;
                animate?: boolean | string;
                position?:
                    | "center"
                    | "top-left"
                    | "top-center"
                    | "top-right"
                    | "left"
                    | "right"
                    | "bottom-left"
                    | "bottom-center"
                    | "bottom-right";
            }>;
            "y-drawer": El<{
                visible?: boolean | string;
                anchor?: string;
                position?: "left" | "right" | "top" | "bottom";
                resizable?: boolean | string;
            }>;
            "y-icon": El<{
                name?: string;
                size?: "x-small" | "small" | "medium" | "large" | "x-large";
                color?: string;
                label?: string;
                weight?: "thin" | "regular" | "thick" | "x-thin" | "x-thick";
            }>;
            "y-input": El<{
                type?: string;
                name?: string;
                value?: string;
                disabled?: boolean | string;
                invalid?: boolean | string;
                size?: "small" | "medium" | "large";
                placeholder?: string;
                "label-position"?: "top" | "bottom";
            }>;
            "y-menu": El<{
                items?: unknown[] | string;
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
            "y-rating": El<{
                name?: string;
                value?: string | number;
                max?: string | number;
                icon?: string;
                color?: string;
                size?: "small" | "medium" | "large";
                disabled?: boolean | string;
                readonly?: boolean | string;
                required?: boolean | string;
            }>;
            "y-radio": El<{
                name?: string;
                value?: string;
                options?: Array<{ value: string; label: string }> | string;
                disabled?: boolean | string;
            }>;
            "y-select": El<{
                name?: string;
                value?: string;
                disabled?: boolean | string;
                multiple?: boolean | string;
                size?: "small" | "medium" | "large";
                placeholder?: string;
                options?: Array<{ value: string; label: string }> | string;
                invalid?: boolean | string;
                required?: boolean | string;
                searchable?: boolean | string;
                clearable?: boolean | string;
                "label-position"?: "top" | "bottom";
                "display-mode"?: "tag";
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
                animate?: boolean | string;
                "toggle-label"?: boolean | string;
                "label-position"?: "top" | "bottom" | "left" | "right";
                color?: string;
                size?: "small" | "medium" | "large";
            }>;
            "y-textarea": El<{
                name?: string;
                value?: string;
                rows?: string | number;
                placeholder?: string;
                disabled?: boolean | string;
                required?: boolean | string;
                invalid?: boolean | string;
                size?: "small" | "medium" | "large";
                "label-position"?: "top" | "bottom";
            }>;
            "y-table": El<{
                columns?: unknown[] | string;
                data?: unknown[] | string;
                striped?: boolean | string;
                size?: "small" | "medium" | "large";
            }>;
            "y-tabs": El<{
                options?:
                    | Array<{
                          id: string;
                          label: string;
                          slot?: string;
                          disabled?: boolean;
                      }>
                    | string;
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
                "cross-origin"?: boolean | string;
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
