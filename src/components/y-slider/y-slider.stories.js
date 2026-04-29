import "./y-slider.js";

export default {
    title: "Components/Slider",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: { type: "range", min: 0, max: 100, step: 1 },
            description: "Current slider value (single mode).",
            table: { defaultValue: { summary: "50" } },
        },
        valueMin: {
            control: { type: "range", min: 0, max: 100, step: 1 },
            description: "Lower-thumb value (range mode only).",
            table: { defaultValue: { summary: "min" } },
        },
        valueMax: {
            control: { type: "range", min: 0, max: 100, step: 1 },
            description: "Upper-thumb value (range mode only).",
            table: { defaultValue: { summary: "max" } },
        },
        min: {
            control: "number",
            description: "Minimum value.",
            table: { defaultValue: { summary: "0" } },
        },
        max: {
            control: "number",
            description: "Maximum value.",
            table: { defaultValue: { summary: "100" } },
        },
        step: {
            control: "number",
            description: "Step increment. Leave empty for continuous.",
        },
        range: {
            control: "boolean",
            description: "Enable two thumbs for selecting a [valueMin, valueMax] range.",
            table: { defaultValue: { summary: false } },
        },
        minGap: {
            control: "number",
            description: "Minimum distance between thumbs in range mode. Defaults to step ?? 1.",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the track fill and thumb.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Thumb diameter and track thickness.",
            table: { defaultValue: { summary: "medium" } },
        },
        orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
            description: "Slider orientation.",
            table: { defaultValue: { summary: "horizontal" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the slider is disabled.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: 50,
        valueMin: 25,
        valueMax: 75,
        min: 0,
        max: 100,
        range: false,
        color: "primary",
        size: "medium",
        orientation: "horizontal",
        disabled: false,
    },
    render: ({
        value,
        valueMin,
        valueMax,
        min,
        max,
        step,
        range,
        minGap,
        color,
        size,
        orientation,
        disabled,
    }) => {
        const wrapStyle =
            orientation === "vertical"
                ? "height:400px"
                : "width:300px";
        const valueAttrs = range
            ? `value-min="${valueMin}" value-max="${valueMax}"`
            : `value="${value}"`;
        return `
            <div style="${wrapStyle}">
                <y-slider
                    ${valueAttrs}
                    min="${min}"
                    max="${max}"
                    ${step ? `step="${step}"` : ""}
                    ${range ? "range" : ""}
                    ${minGap != null ? `min-gap="${minGap}"` : ""}
                    color="${color}"
                    size="${size}"
                    orientation="${orientation}"
                    ${disabled ? "disabled" : ""}
                ></y-slider>
            </div>
        `;
    },
};

export const Default = {};

export const WithStep = {
    args: { step: 10, value: 40 },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:300px">
            <y-slider value="60" color="primary"></y-slider>
            <y-slider value="60" color="secondary"></y-slider>
            <y-slider value="60" color="success"></y-slider>
            <y-slider value="60" color="warning"></y-slider>
            <y-slider value="60" color="error"></y-slider>
            <y-slider value="60" color="help"></y-slider>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:300px">
            <y-slider value="60" size="small"></y-slider>
            <y-slider value="60" size="medium"></y-slider>
            <y-slider value="60" size="large"></y-slider>
        </div>
    `,
};

export const Disabled = {
    args: { disabled: true, value: 40 },
};

export const Vertical = {
    args: { orientation: "vertical", value: 60 },
};

export const Range = {
    args: { range: true, valueMin: 25, valueMax: 75 },
};

export const RangeWithStep = {
    args: { range: true, step: 5, valueMin: 20, valueMax: 80 },
};

export const RangeWithMinGap = {
    args: { range: true, valueMin: 30, valueMax: 70, minGap: 10 },
};

export const RangeColors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:300px">
            <y-slider range value-min="20" value-max="80" color="primary"></y-slider>
            <y-slider range value-min="20" value-max="80" color="secondary"></y-slider>
            <y-slider range value-min="20" value-max="80" color="success"></y-slider>
            <y-slider range value-min="20" value-max="80" color="warning"></y-slider>
            <y-slider range value-min="20" value-max="80" color="error"></y-slider>
            <y-slider range value-min="20" value-max="80" color="help"></y-slider>
        </div>
    `,
};

export const RangeSizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:300px">
            <y-slider range value-min="20" value-max="80" size="small"></y-slider>
            <y-slider range value-min="20" value-max="80" size="medium"></y-slider>
            <y-slider range value-min="20" value-max="80" size="large"></y-slider>
        </div>
    `,
};

export const VerticalRange = {
    args: {
        orientation: "vertical",
        range: true,
        valueMin: 25,
        valueMax: 75,
    },
};

export const Ticks = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px;width:300px;padding:24px 0">
            <y-slider value="50" min="0" max="100" step="25" ticks="true"></y-slider>
            <y-slider value="50" min="0" max="100" ticks="5"></y-slider>
            <y-slider value="50" min="0" max="100" ticks="[0, 20, 40, 60, 80, 100]"></y-slider>
        </div>
    `,
};

export const TicksWithLabels = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:64px;width:300px;padding:24px 0">
            <y-slider
                value="50"
                min="0"
                max="100"
                step="25"
                ticks="true"
                tick-labels
            ></y-slider>
            <y-slider
                value="40"
                min="0"
                max="100"
                tick-labels
                ticks='[{"value":0,"label":"Low"},{"value":50,"label":"Mid"},{"value":100,"label":"High"}]'
            ></y-slider>
        </div>
    `,
};

export const SnapToTicks = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:64px;width:320px;padding:24px 0">
            <label style="font-size:14px;display:flex;flex-direction:column;gap:8px">
                Drag — value will snap to the nearest tick
                <y-slider
                    value="50"
                    min="0"
                    max="100"
                    step="5"
                    ticks="[0, 25, 50, 75, 100]"
                    tick-labels
                    snap-to-ticks
                ></y-slider>
            </label>
        </div>
    `,
};

export const RangeWithTicks = {
    args: {
        range: true,
        valueMin: 25,
        valueMax: 75,
    },
    render: () => `
        <div style="width:300px;padding:24px 0">
            <y-slider
                range
                min="0"
                max="100"
                value-min="25"
                value-max="75"
                ticks="[0, 25, 50, 75, 100]"
                tick-labels
            ></y-slider>
        </div>
    `,
};

export const VerticalTicks = {
    render: () => `
        <div style="height:400px;display:flex;gap:48px;padding:0 24px">
            <y-slider
                orientation="vertical"
                value="60"
                min="0"
                max="100"
                step="20"
                ticks="true"
            ></y-slider>
            <y-slider
                orientation="vertical"
                value="60"
                min="0"
                max="100"
                ticks="[0, 50, 100]"
                tick-labels
            ></y-slider>
        </div>
    `,
};

export const TooltipAlways = {
    render: () => `
        <div style="width:300px;padding:48px 0 24px">
            <y-slider value="40" show-value="always"></y-slider>
        </div>
    `,
};

export const TooltipOnDrag = {
    render: () => `
        <div style="width:300px;padding:48px 0 24px">
            <y-slider value="40" show-value="dragging"></y-slider>
            <p style="font-size:12px;color:#888;margin-top:8px">
                Hover, focus (Tab), or drag the thumb to reveal the value.
            </p>
        </div>
    `,
};

export const TooltipWithSuffix = {
    render: () => `
        <div style="width:300px;padding:48px 0 24px">
            <y-slider value="65" show-value="always">
                <span slot="value-suffix">%</span>
            </y-slider>
        </div>
    `,
};

export const TooltipWithPrefixAndSuffix = {
    render: () => `
        <div style="width:300px;padding:48px 0 24px">
            <y-slider value="22" min="-20" max="40" show-value="always">
                <span slot="value-prefix">~</span>
                <span slot="value-suffix">°C</span>
            </y-slider>
        </div>
    `,
};

export const TooltipEnd = {
    render: () => `
        <div style="width:300px;padding:24px 0 48px">
            <y-slider
                value="40"
                show-value="always"
                value-position="end"
            ></y-slider>
        </div>
    `,
};

export const TooltipRange = {
    render: () => `
        <div style="width:300px;padding:48px 0 24px">
            <y-slider
                range
                min="0"
                max="500"
                value-min="100"
                value-max="350"
                step="10"
                show-value="always"
                color="success"
            >
                <span slot="value-prefix">$</span>
            </y-slider>
        </div>
    `,
};

export const TooltipVertical = {
    render: () => `
        <div style="height:400px;display:flex;gap:48px;padding:0 48px">
            <y-slider
                orientation="vertical"
                value="60"
                show-value="always"
                value-position="end"
            >
                <span slot="value-suffix">%</span>
            </y-slider>
            <y-slider
                orientation="vertical"
                value="60"
                show-value="always"
                value-position="start"
            >
                <span slot="value-suffix">%</span>
            </y-slider>
        </div>
    `,
};

export const TooltipWithTicks = {
    render: () => `
        <div style="width:320px;padding:48px 0 32px">
            <y-slider
                value="50"
                min="0"
                max="100"
                step="25"
                ticks="true"
                tick-labels
                show-value="dragging"
            >
                <span slot="value-suffix">%</span>
            </y-slider>
        </div>
    `,
};

export const RangeFormAssociation = {
    render: () => `
        <form id="range-form" style="display:flex;flex-direction:column;gap:12px;width:320px">
            <label style="font-size:14px">
                Price band
                <y-slider
                    name="band"
                    range
                    min="0"
                    max="500"
                    value-min="100"
                    value-max="350"
                    step="10"
                    color="success"
                ></y-slider>
            </label>
            <output id="range-output" style="font-family:monospace;font-size:13px"></output>
            <script>
                (() => {
                    const form = document.getElementById("range-form");
                    const out = document.getElementById("range-output");
                    const update = () => {
                        const data = new FormData(form);
                        out.textContent = "band = " + (data.get("band") ?? "(unset)");
                    };
                    form.addEventListener("input", update);
                    update();
                })();
            </script>
        </form>
    `,
};
