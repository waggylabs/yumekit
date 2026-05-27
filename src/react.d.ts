import type { DetailedHTMLProps, HTMLAttributes } from "react";

type El<T = object> = DetailedHTMLProps<
    HTMLAttributes<HTMLElement>,
    HTMLElement
> &
    T;

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "y-animate": El<{
                animation?:
                    | "fade"
                    | "slide"
                    | "zoom-in"
                    | "zoom-out"
                    | "flip-horizontal"
                    | "flip-vertical"
                    | "rotate-in"
                    | "bounce"
                    | "shake"
                    | "scale";
                direction?: "up" | "down" | "left" | "right";
                duration?: string | number;
                delay?: string | number;
                easing?: string;
                trigger?: "load" | "visible" | "manual";
                once?: "true" | "false" | string;
                reverse?: boolean | string;
                stagger?: boolean | string;
                "stagger-delay"?: string | number;
                disabled?: boolean | string;
            }>;
            "y-appbar": El<{
                items?: unknown[] | string;
                size?: "small" | "medium" | "large";
                "menu-direction"?: "right" | "down" | "";
                sticky?: "start" | "end";
                "mobile-breakpoint"?: string | number;
                history?: string;
            }>;
            "y-avatar": El<{
                src?: string;
                alt?: string;
                size?: "small" | "medium" | "large";
                shape?: string;
                color?: string;
            }>;
            "y-avatar-group": El<{
                avatars?:
                    | Array<{
                          alt?: string;
                          src?: string;
                          color?: string;
                          shape?: "circle" | "square" | "rounded";
                      }>
                    | string;
                orientation?: "horizontal" | "vertical";
                overlap?: string | number;
                "stack-order"?: "first" | "last";
                max?: string | number;
                size?: "small" | "medium" | "large";
            }>;
            "y-break": El<{
                orientation?: "horizontal" | "vertical";
                align?: "start" | "center" | "end";
                variant?: "solid" | "dashed" | "dotted";
                label?: string;
                icon?: string;
                inset?: "none" | "small" | "medium" | "large";
            }>;
            "y-breadcrumbs": El<{
                items?: string;
                size?: "small" | "medium" | "large";
                separator?: string;
                "max-items"?: string | number;
                history?: string;
            }>;
            "y-badge": El<{
                value?: string;
                position?: "top" | "bottom";
                alignment?: "right" | "left";
                color?: string;
                size?: "small" | "medium" | "large";
            }>;
            "y-banner": El<{
                color?: string;
                icon?: string;
                position?: "push" | "overlap";
                sticky?: boolean | string;
                dismissable?: boolean | string;
                dismissed?: boolean | string;
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
                "aria-haspopup"?: string;
                "aria-expanded"?: string;
                "aria-controls"?: string;
                href?: string;
                target?: string;
                rel?: string;
            }>;
            "y-button-group": El<{
                orientation?: "horizontal" | "vertical";
            }>;
            "y-card": El<{
                color?: string;
                raised?: boolean | string;
            }>;
            "y-code": El<{
                language?: string;
                "line-numbers"?: boolean | string;
                "max-lines"?: number | string;
                wrap?: boolean | string;
                filename?: string;
                copyable?: boolean | string;
                disabled?: boolean | string;
                "copy-label"?: string;
                "copied-label"?: string;
            }>;
            "y-checkbox": El<{
                name?: string;
                value?: string;
                checked?: boolean | string;
                disabled?: boolean | string;
                indeterminate?: boolean | string;
                "label-position"?: "top" | "bottom" | "left" | "right";
            }>;
            "y-color": El<{
                name?: string;
                value?: string;
                format?: "hex" | "rgb" | "hsl" | "hsv";
                formats?: Array<"hex" | "rgb" | "hsl" | "hsv"> | string;
                "show-alpha"?: boolean | string;
                placeholder?: string;
                disabled?: boolean | string;
                invalid?: boolean | string;
                clearable?: boolean | string;
                size?: "small" | "medium" | "large";
                "label-position"?: "top" | "bottom";
            }>;
            "y-colorpicker": El<{
                value?: string;
                format?: "hex" | "rgb" | "hsl" | "hsv";
                formats?: Array<"hex" | "rgb" | "hsl" | "hsv"> | string;
                "show-alpha"?: boolean | string;
                size?: "small" | "medium" | "large";
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
            "y-dock": El<{
                items?: unknown[] | string;
                position?: "top" | "bottom";
                breakpoint?: string | number;
                size?: "small" | "medium" | "large";
                history?: string;
            }>;
            "y-drawer": El<{
                visible?: boolean | string;
                anchor?: string;
                position?: "left" | "right" | "top" | "bottom";
                resizable?: boolean | string;
            }>;
            "y-droplist": El<{
                group?: string;
                disabled?: boolean | string;
                vertical?: "true" | "false" | string;
                animation?: string | number;
                "ghost-class"?: string;
                "drag-class"?: string;
                handle?: string;
            }>;
            "y-gallery": El<{
                layout?: "grid" | "row" | "column" | "masonry";
                columns?: string | number;
                gap?: "small" | "medium" | "large" | string;
                "aspect-ratio"?: string;
                expandable?: boolean | string;
                loop?: boolean | string;
                size?: "small" | "medium" | "large";
            }>;
            "y-grid": El<{
                columns?: string | number;
                rows?: string | number;
                "auto-flow"?: "row" | "column" | "row dense" | "column dense";
                "auto-rows"?: string;
                "auto-columns"?: string;
                gap?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                "row-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                "column-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                align?: "start" | "center" | "end" | "stretch" | "baseline";
                justify?: "start" | "center" | "end" | "stretch";
                "align-content"?:
                    | "start"
                    | "center"
                    | "end"
                    | "stretch"
                    | "between"
                    | "around"
                    | "evenly";
                "justify-content"?:
                    | "start"
                    | "center"
                    | "end"
                    | "stretch"
                    | "between"
                    | "around"
                    | "evenly";
                "min-item-width"?: string;
                responsive?: boolean | string;
                dense?: boolean | string;
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
                "label-position"?: "top" | "bottom";
                min?: string | number;
                max?: string | number;
                step?: string | number;
            }>;
            "y-masonry": El<{
                columns?: string | number;
                gap?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                "row-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                "column-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                responsive?: boolean | string;
            }>;
            "y-menu": El<{
                items?: unknown[] | string;
                anchor?: string;
                visible?: boolean | string;
                direction?: "down" | "up" | "left" | "right";
                size?: "small" | "medium" | "large";
                history?: string;
            }>;
            "y-paginator": El<{
                "current-page"?: string | number;
                "total-pages"?: string | number;
                "page-count"?: string | number;
                "boundary-count"?: string | number;
                variant?: "default" | "compact" | "detailed";
                size?: "small" | "medium" | "large";
                disabled?: boolean | string;
                "hide-on-single-page"?: boolean | string;
                "items-per-page"?: string | number;
                "page-size-options"?:
                    | Array<number | { value: number | string; label?: string }>
                    | string;
                "page-size-label"?: string;
                "aria-label"?: string;
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
            "y-sidebar": El<{
                collapsed?: boolean | string;
                items?: unknown[] | string;
                size?: "small" | "medium" | "large";
                "menu-direction"?: "right" | "down" | "";
                sticky?: "start" | "end";
                history?: string;
            }>;
            "y-progress": El<{
                mode?: "bar" | "ring" | "pie";
                value?: string | number;
                values?:
                    | Array<{ value: number; color?: string; label?: string }>
                    | string;
                min?: string | number;
                max?: string | number;
                step?: string | number;
                color?: string;
                "track-color"?: string;
                size?: "small" | "medium" | "large" | string;
                thickness?: "small" | "medium" | "large" | string;
                "label-display"?: boolean | string;
                "label-format"?: "percent" | "value" | "fraction";
                indeterminate?: boolean | string;
                disabled?: boolean | string;
                segmented?: boolean | string | number;
                "segment-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | string;
                "start-angle"?: string | number;
                direction?: "clockwise" | "counterclockwise";
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
            "y-shape": El<{
                type?:
                    | "rectangle"
                    | "circle"
                    | "ellipse"
                    | "star"
                    | "heart"
                    | "chat-bubble"
                    | "times"
                    | "cross"
                    | "polygon";
                "polygon-points"?: string;
                radius?: string | number;
                fit?: "contain" | "cover" | "fill";
                "preserve-aspect"?: boolean | string;
                size?: "small" | "medium" | "large";
            }>;
            "y-slider": El<{
                name?: string;
                value?: string | number;
                "value-min"?: string | number;
                "value-max"?: string | number;
                min?: string | number;
                max?: string | number;
                step?: string | number;
                disabled?: boolean | string;
                color?: string;
                size?: "small" | "medium" | "large";
                orientation?: "horizontal" | "vertical";
                range?: boolean | string;
                "min-gap"?: string | number;
                "aria-label-min"?: string;
                "aria-label-max"?: string;
                ticks?: string | number;
                "tick-labels"?: string;
                "snap-to-ticks"?: boolean | string;
                "show-value"?: boolean | string;
                "value-position"?: "auto" | "above" | "below" | string;
            }>;
            "y-splitter": El<{
                orientation?: "horizontal" | "vertical";
                split?: string | number;
                "min-ratio"?: string | number;
                "max-ratio"?: string | number;
                disabled?: boolean | string;
                "handle-size"?: string | number;
                "handle-position"?: "center" | "start" | "end";
            }>;
            "y-stack": El<{
                direction?: "row" | "row-reverse" | "column" | "column-reverse";
                wrap?: boolean | "nowrap" | "wrap" | "wrap-reverse";
                gap?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                "row-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                "column-gap"?:
                    | "none"
                    | "x-small"
                    | "small"
                    | "medium"
                    | "large"
                    | "x-large"
                    | "2x-large"
                    | "4x-large";
                align?: "start" | "center" | "end" | "stretch" | "baseline";
                justify?:
                    | "start"
                    | "center"
                    | "end"
                    | "between"
                    | "around"
                    | "evenly";
                "align-content"?:
                    | "start"
                    | "center"
                    | "end"
                    | "stretch"
                    | "between"
                    | "around"
                    | "evenly";
                inline?: boolean | string;
                responsive?: boolean | string;
            }>;
            "y-stepper": El<{
                items?: unknown[] | string;
                current?: number | string;
                orientation?: "horizontal" | "vertical";
                position?: "start" | "end";
                size?: "small" | "medium" | "large";
                linear?: boolean | string;
                editable?: boolean | string;
                responsive?: boolean | string;
                "responsive-breakpoint"?: number | string;
            }>;
            "y-switch": El<{
                name?: string;
                value?: string;
                checked?: boolean | string;
                disabled?: boolean | string;
                animate?: boolean | string;
                "toggle-label"?: boolean | string;
                "label-position"?: "top" | "bottom" | "left" | "right";
                "on-color"?: string;
                "off-color"?: string;
                size?: "small" | "medium" | "large";
            }>;
            "y-textarea": El<{
                name?: string;
                value?: string;
                rows?: string | number;
                disabled?: boolean | string;
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
                          leftIcon?: string;
                          rightIcon?: string;
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
                "no-default-font"?: boolean | string;
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
                open?: boolean | string;
            }>;
            "y-tree": El<{
                exclusive?: boolean | string;
                selection?: "single" | "none";
                "route-match"?: "exact" | "prefix" | "off";
                "aria-label"?: string;
            }>;
            "y-tree-item": El<{
                href?: string;
                expanded?: boolean | string;
                selected?: boolean | string;
                disabled?: boolean | string;
                history?: "push" | "replace" | "false";
            }>;
        }
    }
}
