#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
if ((process.env["NODE_OPTIONS"] || "").includes("--loader ts-node"))
    require("./cli");
else
    (0, child_process_1.spawnSync)(process.argv[0], process.argv.slice(1), {
        stdio: "inherit",
        env: {
            ...process.env,
            NODE_OPTIONS: [
                process.env["NODE_OPTIONS"],
                "--loader ts-node/esm",
                "--no-warnings",
            ]
                .filter((item) => !!item)
                .join(" "),
        },
        windowsHide: true,
    });

//# sourceMappingURL=cli-ts-node-esm.js.map
