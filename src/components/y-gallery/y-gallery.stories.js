import "./y-gallery.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Data/Gallery",
    tags: ["autodocs"],
    argTypes: {
        layout: {
            control: "select",
            options: ["grid", "row", "column", "masonry"],
            description: "Controls how thumbnails are arranged.",
            table: { defaultValue: { summary: "grid" } },
        },
        columns: {
            control: "number",
            description: "Number of columns in grid and masonry layouts.",
            table: { defaultValue: { summary: 3 } },
        },
        gap: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Spacing between items.",
            table: { defaultValue: { summary: "medium" } },
        },
        aspectRatio: {
            control: "text",
            description: "Thumbnail aspect ratio (e.g. 1/1, 4/3, 16/9).",
            table: { defaultValue: { summary: "1/1" } },
        },
        expandable: {
            control: "boolean",
            description: "Whether clicking a thumbnail opens the expanded view.",
            table: { defaultValue: { summary: true } },
        },
        loop: {
            control: "boolean",
            description: "Whether navigation wraps around.",
            table: { defaultValue: { summary: false } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Controls thumbnail min-width and arrow button size.",
            table: { defaultValue: { summary: "medium" } },
        },
    },
    args: {
        layout: "grid",
        columns: 3,
        gap: "medium",
        aspectRatio: "1/1",
        expandable: true,
        loop: false,
        size: "medium",
    },
    render: ({ layout, columns, gap, aspectRatio, expandable, loop, size }) => `
        <y-gallery
            layout="${layout}"
            columns="${columns}"
            gap="${gap}"
            aspect-ratio="${aspectRatio}"
            ${expandable === false ? 'expandable="false"' : ""}
            ${loop ? "loop" : ""}
            size="${size}"
        >
            <img src="https://picsum.photos/seed/gallery1/400/300" alt="Mountain landscape">
            <img src="https://picsum.photos/seed/gallery2/400/400" alt="Ocean sunset">
            <img src="https://picsum.photos/seed/gallery3/400/350" alt="Forest path">
            <img src="https://picsum.photos/seed/gallery4/400/500" alt="City skyline">
            <img src="https://picsum.photos/seed/gallery5/400/280" alt="Desert dunes">
            <img src="https://picsum.photos/seed/gallery6/400/450" alt="Snowy peaks">
        </y-gallery>
    `,
};

export const Default = {};

export const Layouts = {
    render: () => `
        <h3 style="margin:0 0 8px">Grid (default)</h3>
        <y-gallery layout="grid" columns="3" gap="medium">
            <img src="https://picsum.photos/seed/g1/300/300" alt="Image 1">
            <img src="https://picsum.photos/seed/g2/300/300" alt="Image 2">
            <img src="https://picsum.photos/seed/g3/300/300" alt="Image 3">
            <img src="https://picsum.photos/seed/g4/300/300" alt="Image 4">
            <img src="https://picsum.photos/seed/g5/300/300" alt="Image 5">
            <img src="https://picsum.photos/seed/g6/300/300" alt="Image 6">
        </y-gallery>

        <h3 style="margin:24px 0 8px">Masonry</h3>
        <y-gallery layout="masonry" columns="3" gap="medium">
            <img src="https://picsum.photos/seed/m1/300/400" alt="Image 1">
            <img src="https://picsum.photos/seed/m2/300/200" alt="Image 2">
            <img src="https://picsum.photos/seed/m3/300/350" alt="Image 3">
            <img src="https://picsum.photos/seed/m4/300/280" alt="Image 4">
            <img src="https://picsum.photos/seed/m5/300/450" alt="Image 5">
            <img src="https://picsum.photos/seed/m6/300/320" alt="Image 6">
        </y-gallery>

        <h3 style="margin:24px 0 8px">Row (horizontal scroll)</h3>
        <y-gallery layout="row" gap="medium" aspect-ratio="4/3">
            <img src="https://picsum.photos/seed/r1/300/225" alt="Image 1">
            <img src="https://picsum.photos/seed/r2/300/225" alt="Image 2">
            <img src="https://picsum.photos/seed/r3/300/225" alt="Image 3">
            <img src="https://picsum.photos/seed/r4/300/225" alt="Image 4">
            <img src="https://picsum.photos/seed/r5/300/225" alt="Image 5">
        </y-gallery>

        <h3 style="margin:24px 0 8px">Column</h3>
        <y-gallery layout="column" gap="medium">
            <img src="https://picsum.photos/seed/c1/600/200" alt="Image 1">
            <img src="https://picsum.photos/seed/c2/600/200" alt="Image 2">
            <img src="https://picsum.photos/seed/c3/600/200" alt="Image 3">
        </y-gallery>
    `,
};

export const WithCaptions = {
    render: () => `
        <y-gallery layout="grid" columns="3" gap="medium" loop>
            <figure>
                <img src="https://picsum.photos/seed/f1/400/300" alt="Mountain vista">
                <figcaption>Mountain vista at sunrise</figcaption>
            </figure>
            <figure>
                <img src="https://picsum.photos/seed/f2/400/300" alt="Sunset">
                <figcaption>Golden hour at the coast</figcaption>
            </figure>
            <figure>
                <img src="https://picsum.photos/seed/f3/400/300" alt="Forest">
                <figcaption>Ancient redwood forest</figcaption>
            </figure>
        </y-gallery>
    `,
};

export const WithDataSrc = {
    render: () => `
        <p style="margin:0 0 8px; font-size:0.85em; color:#666">Click any thumbnail to see the full-size image loaded via data-src.</p>
        <y-gallery layout="grid" columns="3" gap="medium" loop>
            <img src="https://picsum.photos/seed/ds1/200/200" data-src="https://picsum.photos/seed/ds1/1200/900" alt="Thumbnail 1">
            <img src="https://picsum.photos/seed/ds2/200/200" data-src="https://picsum.photos/seed/ds2/1200/900" alt="Thumbnail 2">
            <img src="https://picsum.photos/seed/ds3/200/200" data-src="https://picsum.photos/seed/ds3/1200/900" alt="Thumbnail 3">
        </y-gallery>
    `,
};

export const AspectRatios = {
    render: () => `
        <h3 style="margin:0 0 8px">1/1 (Square)</h3>
        <y-gallery layout="grid" columns="4" aspect-ratio="1/1" gap="small">
            <img src="https://picsum.photos/seed/ar1/300/300" alt="Image 1">
            <img src="https://picsum.photos/seed/ar2/300/300" alt="Image 2">
            <img src="https://picsum.photos/seed/ar3/300/300" alt="Image 3">
            <img src="https://picsum.photos/seed/ar4/300/300" alt="Image 4">
        </y-gallery>

        <h3 style="margin:24px 0 8px">16/9 (Widescreen)</h3>
        <y-gallery layout="grid" columns="3" aspect-ratio="16/9" gap="small">
            <img src="https://picsum.photos/seed/ar5/400/225" alt="Image 5">
            <img src="https://picsum.photos/seed/ar6/400/225" alt="Image 6">
            <img src="https://picsum.photos/seed/ar7/400/225" alt="Image 7">
        </y-gallery>

        <h3 style="margin:24px 0 8px">4/3</h3>
        <y-gallery layout="grid" columns="3" aspect-ratio="4/3" gap="small">
            <img src="https://picsum.photos/seed/ar8/400/300" alt="Image 8">
            <img src="https://picsum.photos/seed/ar9/400/300" alt="Image 9">
            <img src="https://picsum.photos/seed/ar10/400/300" alt="Image 10">
        </y-gallery>
    `,
};

export const NonExpandable = {
    render: () => `
        <y-gallery layout="grid" columns="3" gap="medium" expandable="false">
            <img src="https://picsum.photos/seed/ne1/300/300" alt="Image 1">
            <img src="https://picsum.photos/seed/ne2/300/300" alt="Image 2">
            <img src="https://picsum.photos/seed/ne3/300/300" alt="Image 3">
        </y-gallery>
    `,
};
