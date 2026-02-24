#!/usr/bin/env node

/**
 * Post-processing script to strip bare class field declarations from tsgo output.
 * tsgo doesn't support `useDefineForClassFields: false` yet, so it emits
 * field declarations like `x;` inside class bodies. This script removes them
 * to match tsc behavior with `useDefineForClassFields: false`.
 *
 * tsc output:
 * let PostDetails = class PostDetails { };
 *
 * tsgo output:
 * let PostDetails = class PostDetails {
 *     keyword;  // ← extra
 *     post;     // ← extra
 * };
 *
 * See: https://github.com/microsoft/typescript-go/issues/785
 */

const fs = require("fs")
const path = require("path")

const buildDir = path.join(__dirname, "..", "build", "compiled")

// Matches bare field declarations: `    identifier;` or `    #identifier;`
// Does NOT match lines with `=` (initializers), `(` (methods), or other syntax.
const FIELD_DECL_RE = /^(\s+)#?[a-zA-Z_$][a-zA-Z0-9_$]*;\s*$/

function processFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")
    let modified = false
    let inClass = false
    let braceDepth = 0

    const result = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Detect class opening: `let Foo = class Foo {` or `class Foo {`
        if (/\bclass\s+\w+/.test(line) && line.includes("{")) {
            inClass = true
            braceDepth = 1
            result.push(line)
            continue
        }

        if (inClass) {
            // Track brace depth
            for (const ch of line) {
                if (ch === "{") braceDepth++
                else if (ch === "}") braceDepth--
            }

            if (braceDepth <= 0) {
                inClass = false
            }

            // Strip bare field declarations at class body level (depth 1)
            if (braceDepth === 1 && FIELD_DECL_RE.test(line)) {
                modified = true
                continue
            }
            // Also catch the field on the line right before closing brace (depth just went to 0)
            if (braceDepth === 0 && FIELD_DECL_RE.test(line)) {
                modified = true
                continue
            }
        }

        result.push(line)
    }

    if (modified) {
        fs.writeFileSync(filePath, result.join("\n"), "utf8")
    }
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full)
        } else if (entry.name.endsWith(".js")) {
            processFile(full)
        }
    }
}

if (!fs.existsSync(buildDir)) {
    console.error("build/compiled not found, run tsgo first")
    process.exit(1)
}

walk(buildDir)
