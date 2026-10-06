// pnpm rewrites a `workspace:` specifier at publish time, replacing it with the
// version of the linked package as it stands in that moment. During a nightly
// publish that version is a nightly build, so a `workspace:` specifier in a
// field that consumers install from would pin them to a nightly.
//
// `devDependencies` are safe: they are metadata in a published package and
// nothing installs them. Anything else is not.
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const INSTALLED_FIELDS = [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
]

const manifests = readdirSync("packages", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join("packages", entry.name, "package.json"))
    .filter((file) => existsSync(file))

if (manifests.length === 0) {
    console.error("no package manifests found under packages/")
    process.exit(1)
}

const offenders = []
for (const file of manifests) {
    const pkg = JSON.parse(readFileSync(file, "utf8"))
    if (pkg.private) continue
    for (const field of INSTALLED_FIELDS) {
        for (const [name, range] of Object.entries(pkg[field] ?? {})) {
            if (String(range).startsWith("workspace:")) {
                offenders.push(`${file}: ${field}.${name} = ${range}`)
            }
        }
    }
}

if (offenders.length > 0) {
    console.error(
        "The workspace protocol is only safe in devDependencies.\n" +
            "These would pin consumers to whatever version is published alongside them:\n\n" +
            offenders.map((offender) => `  ${offender}`).join("\n") +
            "\n\nUse an explicit range instead.",
    )
    process.exit(1)
}

console.log(`checked ${manifests.length} package manifests`)
