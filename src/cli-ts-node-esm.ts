#!/usr/bin/env node
import { spawnSync } from "child_process"

if ((process.env["NODE_OPTIONS"] || "").includes("--loader ts-node"))
    require("./cli")
else
    spawnSync(process.argv[0], process.argv.slice(1), {
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
    })
