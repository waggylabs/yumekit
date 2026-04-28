import "./y-splitter.js";
import "../y-card/y-card.js";
import "../y-icon/y-icon.js";

const paneStyle =
  "padding:16px;background:var(--base-background-component);color:var(--base-content);height:100%;box-sizing:border-box;overflow:auto";

export default {
  title: "Components/Splitter",
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Direction of the split.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    split: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "Ratio of the first pane (0.0 to 1.0).",
      table: { defaultValue: { summary: "0.5" } },
    },
    minRatio: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Minimum ratio for the first pane.",
      table: { defaultValue: { summary: "0.1" } },
    },
    maxRatio: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Maximum ratio for the first pane.",
      table: { defaultValue: { summary: "0.9" } },
    },
    handleSize: {
      control: { type: "number", min: 4, max: 40, step: 1 },
      description: "Width or height of the drag handle in pixels.",
      table: { defaultValue: { summary: "10" } },
    },
    handlePosition: {
      control: "select",
      options: ["center", "start", "end"],
      description: "Position of the visible line within the handle.",
      table: { defaultValue: { summary: "center" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables drag and keyboard resizing.",
    },
  },
  args: {
    orientation: "horizontal",
    split: 0.5,
    minRatio: 0.1,
    maxRatio: 0.9,
    handleSize: 10,
    handlePosition: "center",
    disabled: false,
  },
  render: ({
    orientation,
    split,
    minRatio,
    maxRatio,
    handleSize,
    handlePosition,
    disabled,
  }) => `
        <div style="width:600px;height:300px;border:1px solid var(--base-border)">
            <y-splitter
                orientation="${orientation}"
                split="${split}"
                min-ratio="${minRatio}"
                max-ratio="${maxRatio}"
                handle-size="${handleSize}"
                handle-position="${handlePosition}"
                ${disabled ? "disabled" : ""}
            >
                <div style="${paneStyle}">
                    <strong>Pane 1</strong>
                    <p>The resizable pane. Drag the handle to resize.</p>
                </div>
                <div style="${paneStyle}">
                    <strong>Pane 2</strong>
                    <p>Fills the remaining space.</p>
                </div>
            </y-splitter>
        </div>
    `,
};

export const Horizontal = {};

export const Vertical = {
  args: { orientation: "vertical" },
};

export const ConstrainedRange = {
  args: { minRatio: 0.25, maxRatio: 0.75 },
  parameters: {
    docs: {
      description: {
        story:
          "Min and max ratios prevent collapsing past 25% / 75% — try dragging past either end.",
      },
    },
  },
};

export const HandleAtStart = {
  args: { handlePosition: "start", handleSize: 14 },
};

export const HandleAtEnd = {
  args: { handlePosition: "end", handleSize: 14 },
};

export const Disabled = {
  args: { disabled: true },
};

export const NestedSplitters = {
  render: () => `
        <div style="width:700px;height:400px;border:1px solid var(--base-border)">
            <y-splitter split="0.3">
                <div style="${paneStyle}">
                    <strong>Sidebar</strong>
                </div>
                <y-splitter orientation="vertical" split="0.6">
                    <div style="${paneStyle}">
                        <strong>Main content</strong>
                    </div>
                    <div style="${paneStyle}">
                        <strong>Output</strong>
                    </div>
                </y-splitter>
            </y-splitter>
        </div>
    `,
};

export const CustomHandle = {
  render: () => `
        <div style="width:600px;height:300px;border:1px solid var(--base-border)">
            <y-splitter handle-size="24">
                <div style="${paneStyle}">Left</div>
                <div style="${paneStyle}">Right</div>
                <span slot="handle" style="display:flex;align-items:center;justify-content:center;background:var(--primary-content);color:var(--primary-content-inverse);width:100%;height:100%">
                    <y-icon name="ellipsis-v" aria-hidden="true"></y-icon>
                </span>
            </y-splitter>
        </div>
    `,
};

export const ListenForChanges = {
  render: () => {
    const id = "splitter-events-" + Math.random().toString(36).slice(2, 8);
    // The event listener is attached by an inline script so we can preview
    // event payloads inline in the docs frame.
    return `
            <div style="width:600px">
                <div style="height:240px;border:1px solid var(--base-border)">
                    <y-splitter id="${id}">
                        <div style="${paneStyle}">Drag the handle</div>
                        <div style="${paneStyle}">to update the readout below</div>
                    </y-splitter>
                </div>
                <pre id="${id}-out" style="margin-top:8px;padding:8px;background:var(--base-background-component);color:var(--base-content);min-height:1.5em">split: 0.5</pre>
                <script>
                    (function () {
                        var el = document.getElementById("${id}");
                        var out = document.getElementById("${id}-out");
                        if (!el || !out) return;
                        el.addEventListener("split-changed", function (e) {
                            out.textContent = "split: " + e.detail.split.toFixed(2);
                        });
                    })();
                </script>
            </div>
        `;
  },
};
