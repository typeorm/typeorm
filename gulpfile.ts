import { exec } from "child_process"
import fs from "fs/promises"
import gulp from "gulp"
import rename from "gulp-rename"
import { promisify } from "util"

const execAsync = promisify(exec)

// -------------------------------------------------------------------------
// Packaging for browser
// -------------------------------------------------------------------------

function browserCopySources() {
    return gulp
        .src([
            "./src/**/*.ts",
            "!./src/commands/*.ts",
            "!./src/cli.ts",
            "!./src/typeorm.ts",
            "!./src/typeorm-model-shim.ts",
        ])
        .pipe(gulp.dest("./build/browser/src"))
}

function browserCopyTemplates() {
    return gulp
        .src("./src/platform/*.template")
        .pipe(
            rename((p) => {
                p.extname = ".ts"
            }),
        )
        .pipe(gulp.dest("./build/browser/src/platform"))
}

async function browserCompile() {
    await execAsync("tsc -p tsconfig.browser.json")
}

// -------------------------------------------------------------------------
// Packaging for Node.js
// -------------------------------------------------------------------------

async function packageCompile() {
    await execAsync("tsc -p tsconfig.package.json")
}

async function packageCreateEsmIndex() {
    const buildDir = "./build/package"
    const cjsIndex = require(`${buildDir}/index.js`)
    const cjsKeys = Object.keys(cjsIndex).filter(
        (key) => key !== "default" && !key.startsWith("__"),
    )

    const indexMjsContent =
        'import TypeORM from "./index.js";\n' +
        `const {\n    ${cjsKeys.join(",\n    ")}\n} = TypeORM;\n` +
        `export {\n    ${cjsKeys.join(",\n    ")}\n};\n` +
        "export default TypeORM;\n"

    await fs.writeFile(`${buildDir}/index.mjs`, indexMjsContent, "utf8")
}

// -------------------------------------------------------------------------
// Packaging
// -------------------------------------------------------------------------

async function packageCopyPackageFile() {
    const pkg = JSON.parse(await fs.readFile("./package.json", "utf8"))

    delete pkg.devDependencies
    delete pkg.devEngines
    delete pkg.packageManager
    delete pkg.pnpm
    delete pkg.scripts

    await fs.writeFile(
        "./build/package/package.json",
        JSON.stringify(pkg, null, 2) + "\n",
    )
}

function packageCopyShims() {
    return gulp
        .src([
            "./extra/typeorm-model-shim.js",
            "./extra/typeorm-class-transformer-shim.js",
        ])
        .pipe(gulp.dest("./build/package"))
}

// -------------------------------------------------------------------------
// Tasks
// -------------------------------------------------------------------------

gulp.task(
    "package",
    gulp.series(
        () => fs.rm("./build", { recursive: true, force: true }),
        gulp.parallel(browserCopySources, browserCopyTemplates),
        gulp.parallel(packageCompile, browserCompile),
        packageCreateEsmIndex,
        gulp.parallel(packageCopyPackageFile, packageCopyShims),
    ),
)

gulp.task("clean", () => fs.rm("./build", { recursive: true, force: true }))
