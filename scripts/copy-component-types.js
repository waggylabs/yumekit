import { readdirSync, copyFileSync, existsSync } from "fs";
import { join } from "path";

const dir = "dist/components";

readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .forEach((d) => {
        const src = join(dir, d.name, `${d.name}.d.ts`);
        if (existsSync(src)) {
            copyFileSync(src, join(dir, `${d.name}.d.ts`));
        }
    });
