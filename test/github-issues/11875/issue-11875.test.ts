import "reflect-metadata"
import { expect } from "chai"
import * as fs from "fs"
import * as path from "path"
import {
    spawnSync,
    execSync,
    type SpawnSyncOptionsWithStringEncoding,
} from "child_process"
import * as sinon from "sinon"

interface PnpDetectionResult {
    isPnpEnabled: boolean
    detectionMethod: string
    details?: Record<string, unknown>
}

interface OrmConfig {
    skip?: boolean
    name: string
    type: string
    database?: string
    logging?: boolean
    relationLoadStrategy?: string
    [key: string]: unknown
}

// Universal folders path
const typeormRootProjectDir = process.cwd()
const typeormCompiledPackageDir = path.join(
    typeormRootProjectDir,
    "/build/package/",
)
const testRootDir = path.join(
    typeormRootProjectDir,
    "/test/github-issues/11875/",
)
const testPackageCopyDir = path.join(testRootDir, "/.package-copy")
const subProjectTestDir = path.join(testRootDir, "/.test-pnp-project/")
const subProjectTestSrcDir = path.join(subProjectTestDir, "/src/")
const subProjectTestEntitiesDir = path.join(subProjectTestSrcDir, "entities")
const migrationsDirRelativePath = "src/migrations"
const subProjectTestMigrationsDirPath = path.join(
    subProjectTestDir,
    migrationsDirRelativePath,
)

// Universal files path
const packageJsonPath = path.join(subProjectTestDir, "package.json")
const yarnLockPath = path.join(subProjectTestDir, "yarn.lock")
const yarnrcYmlPath = path.join(subProjectTestDir, ".yarnrc.yml")

// Javascript files path
const entityJsFilePath = path.join(subProjectTestEntitiesDir, "User.js")
const ormConfigJsPath = path.join(subProjectTestDir, "ormconfig.js")

// TypeScript files path
const entityTsFilePath = path.join(subProjectTestEntitiesDir, "User.ts")
const ormConfigTsPath = path.join(subProjectTestDir, "ormconfig.ts")
const tsConfigPath = path.join(subProjectTestDir, "tsconfig.json")

// TypeScript + alias path
const aliasLoader = path.join(subProjectTestDir, "alias-loader.mjs")

const yarnMinVersion = "4.12.0"

// Universal files content
const yarnrcYml = [
    `nodeLinker: pnp`,
    `pnpMode: strict`,
    `enableGlobalCache: false`,
].join("\n")

const sampleOrmConfigContent = fs.readFileSync(
    path.join(typeormRootProjectDir, "ormconfig.sample.json"),
    "utf8",
)
const sampleOrmConfig: OrmConfig[] = JSON.parse(sampleOrmConfigContent)
const sqliteConfig = sampleOrmConfig.find(
    (config: OrmConfig) => config.name === "sqlite",
)
if (!sqliteConfig) {
    throw new Error("SQLite configuration not found in ormconfig.sample.json")
}
const ormConfigContent = [
    'import { DataSource } from "typeorm";',
    "",
    "export const AppDataSource = new DataSource(",
    JSON.stringify(
        {
            ...sqliteConfig,
            migrations: [`${migrationsDirRelativePath}/*.{ts,js}`],
            entities: ["src/**/*.{ts,js}"],
            synchronize: false,
        },
        null,
        2,
    ),
    ");",
].join("\n")

// CJS js files content
const packageJsonCjsProject = {
    name: "test-pnp-project-cjs",
    version: "1.0.0",
    private: true,
    type: "commonjs",
    packageManager: "yarn@4.12.0",
    scripts: {
        typeorm:
            "NODE_OPTIONS='--require ./.pnp.cjs --loader ./.pnp.loader.mjs --no-warnings' typeorm",
    },
    dependencies: {
        sqlite3: "^5.1.7",
        "reflect-metadata": "^0.2.2",
        typeorm: `file:${testPackageCopyDir}`,
    },
    dependenciesMeta: {
        typeorm: {
            built: true,
            unplugged: true,
        },
    },
}

const entityCjsContent = [
    'const { EntitySchema } = require("typeorm");',
    "",
    "module.exports = new EntitySchema({",
    '    name: "User",',
    '    tableName: "user",',
    "    columns: {",
    "        id: {",
    "            primary: true,",
    '            type: "int",',
    "            generated: true",
    "        },",
    "        name: {",
    '            type: "varchar"',
    "        }",
    "    }",
    "});",
].join("\n")

const ormConfigCjsContent = [
    'const { DataSource } = require("typeorm");',
    "",
    "const AppDataSource = new DataSource(",
    JSON.stringify(
        {
            ...sqliteConfig,
            migrations: [`${migrationsDirRelativePath}/*.{ts,js}`],
            entities: ["src/**/*.{ts,js}"],
            synchronize: false,
        },
        null,
        2,
    ),
    ");",
    "",
    "module.exports = { AppDataSource };",
].join("\n")

const validCjsMigrationContent = [
    "module.exports = class InitialMigration1767365791032 {",
    '    name = "InitialMigration1767365791032"',
    "    async up(queryRunner) {",
    '        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)`);',
    "    }",
    "    async down(queryRunner) {",
    '        await queryRunner.query(`DROP TABLE "user"`);',
    "    }",
    "}",
].join("\n")

// CTS ts files content
const packageJsonTsCjsProject = {
    name: "test-pnp-project-ts-cjs",
    version: "1.0.0",
    private: true,
    type: "commonjs",
    packageManager: "yarn@4.12.0",
    scripts: {
        typeorm:
            "NODE_OPTIONS='--require ts-node/register --require ./.pnp.cjs --loader ./.pnp.loader.mjs --no-warnings' typeorm-ts-node-commonjs",
    },
    dependencies: {
        sqlite3: "^5.1.7",
        "reflect-metadata": "^0.2.2",
        typeorm: `file:${testPackageCopyDir}`,
    },
    devDependencies: {
        "@types/node": "^25.0.3",
        "ts-node": "^10.9.2",
        typescript: "^5.9.3",
    },
    dependenciesMeta: {
        typeorm: {
            built: true,
            unplugged: true,
        },
        "ts-node": {
            unplugged: true,
        },
    },
}

const tsConfigCjs = {
    compilerOptions: {
        target: "ES2020",
        module: "CommonJS",
        moduleResolution: "Node",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        esModuleInterop: true,
        skipLibCheck: true,
    },
    "ts-node": {
        transpileOnly: true,
    },
}

// ESM js files content
const packageJsonJsProject = {
    name: "test-pnp-project",
    version: "1.0.0",
    private: true,
    type: "module",
    packageManager: "yarn@4.12.0",
    scripts: {
        typeorm:
            "NODE_OPTIONS='--loader ./.pnp.loader.mjs --no-warnings' typeorm",
    },
    dependencies: {
        sqlite3: "^5.1.7",
        "reflect-metadata": "^0.2.2",
        typeorm: `file:${testPackageCopyDir}`,
    },
    dependenciesMeta: {
        typeorm: {
            built: true,
            unplugged: true,
        },
    },
}

const entityJsContent = [
    'import { EntitySchema } from "typeorm"',
    "",
    "export const User = new EntitySchema({",
    '    name: "User",',
    '    tableName: "user",',
    "    columns: {",
    "        id: {",
    "            primary: true,",
    '            type: "int",',
    "            generated: true",
    "        },",
    "        name: {",
    '            type: "varchar"',
    "        }",
    "    }",
    "})",
].join("\n")

const validJsMigrationContent = [
    "export class InitialMigration1767365791032 {",
    '    name = "InitialMigration1767365791032"',
    "    async up(queryRunner) {",
    '        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)`);',
    "    }",
    "    async down(queryRunner) {",
    '        await queryRunner.query(`DROP TABLE "user"`);',
    "    }",
    "}",
].join("\n")

// ESM ts files content
const packageJsonTsProject = {
    name: "test-pnp-project",
    version: "1.0.0",
    private: true,
    type: "module",
    packageManager: "yarn@4.12.0",
    scripts: {
        typeorm:
            "NODE_OPTIONS='--loader ts-node/esm --loader ./.pnp.loader.mjs --no-warnings' typeorm-ts-node-esm",
    },
    dependencies: {
        sqlite3: "^5.1.7",
        "reflect-metadata": "^0.2.2",
        typeorm: `file:${testPackageCopyDir}`,
    },
    devDependencies: {
        "@types/node": "^25.0.3",
        "ts-node": "^10.9.2",
        typescript: "^5.9.3",
    },
    dependenciesMeta: {
        typeorm: {
            built: true,
            unplugged: true,
        },
        "ts-node": {
            unplugged: true,
        },
    },
}

const tsConfig = {
    compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        outDir: "./dist",
        rootDir: "./src",
        paths: {
            "@/*": ["src/*"],
        },
        strict: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        esModuleInterop: true,
        skipLibCheck: true,
    },
    "ts-node": {
        esm: true,
        transpileOnly: true,
    },
}

const entityTsContent = [
    'import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"',
    "",
    "@Entity()",
    "export class User {",
    "    @PrimaryGeneratedColumn()",
    "    id: number",
    "",
    "    @Column()",
    "    name: string",
    "}",
].join("\n")

// ESM ts with alias files content
const packageJsonTsAliasProject = {
    name: "test-pnp-project-ts-alias",
    version: "1.0.0",
    private: true,
    type: "module",
    packageManager: "yarn@4.12.0",
    scripts: {
        typeorm:
            "NODE_OPTIONS='--require ./.pnp.cjs --loader ./alias-loader.mjs --loader ts-node/esm --loader ./.pnp.loader.mjs --no-warnings' typeorm-ts-node-esm",
    },
    dependencies: {
        sqlite3: "^5.1.7",
        "reflect-metadata": "^0.2.2",
        typeorm: `file:${testPackageCopyDir}`,
    },
    devDependencies: {
        "@types/node": "^25.0.3",
        "ts-node": "^10.9.2",
        typescript: "^5.9.3",
        "tsconfig-paths": "^4.2.0",
    },
    dependenciesMeta: {
        typeorm: { built: true, unplugged: true },
        "ts-node": { unplugged: true },
        "tsconfig-paths": { unplugged: true },
    },
}

const tsConfigAlias = {
    compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        baseUrl: ".",
        paths: {
            "@/*": ["src/*"],
        },
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        esModuleInterop: true,
        skipLibCheck: true,
    },
    "ts-node": {
        esm: true,
        transpileOnly: true,
    },
}

const aliasLoaderContent = [
    `import { readFileSync } from 'fs';`,
    `import { pathToFileURL, fileURLToPath } from 'url';`,
    `import { existsSync } from 'fs';`,
    `import { resolve as resolvePath, dirname } from 'path';`,
    ``,
    `// Parse tsconfig.json manually (no external dependencies)`,
    `const projectRoot = process.cwd();`,
    `const tsconfigPath = resolvePath(projectRoot, 'tsconfig.json');`,
    `const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));`,
    `const baseUrl = resolvePath(projectRoot, tsconfig.compilerOptions?.baseUrl || '.');`,
    `const paths = tsconfig.compilerOptions?.paths || {};`,
    ``,
    `// Manual alias resolution function`,
    `function resolveAlias(specifier) {`,
    `  for (const [alias, targets] of Object.entries(paths)) {`,
    `    // Convert 'alias/*' to regex`,
    `    const pattern = alias.replace('*', '(.*)');`,
    `    const regex = new RegExp('^' + pattern + '$');`,
    `    const match = specifier.match(regex);`,
    `    if (match) {`,
    `      // Replace in the target`,
    `      const target = targets[0].replace('*', match[1] || '');`,
    `      return resolvePath(baseUrl, target);`,
    `    }`,
    `  }`,
    `  return null;`,
    `}`,
    ``,
    `export async function resolve(specifier, context, nextResolve) {`,
    `  const aliasPath = resolveAlias(specifier);`,
    `  `,
    `  if (aliasPath) {`,
    `    // 1. Manage aliases and missing extensions`,
    `    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', ''];`,
    `    for (const ext of extensions) {`,
    `      const fullPath = aliasPath + ext;`,
    `      if (existsSync(fullPath)) {`,
    `        // IMPORTANT: We return a COMPLETE and VALID file:// URL.`,
    `        return {`,
    `          url: pathToFileURL(fullPath).href,`,
    `          shortCircuit: false // Let the chain continue (ts-node must compile)`,
    `        };`,
    `      }`,
    `    }`,
    `  }`,
    `  `,
    `  // No alias -> delegate to the next one`,
    `  return nextResolve(specifier, context);`,
    `}`,
].join("\n")

const ormConfigAliasContent = [
    'import { DataSource } from "typeorm";',
    'import { User } from "@/entities/User";',
    "",
    "export const AppDataSource = new DataSource(",
    JSON.stringify(
        {
            ...sqliteConfig,
            entities: ["src/entities/*.ts"],
            migrations: [`${migrationsDirRelativePath}/*.ts`],
            synchronize: false,
        },
        null,
        2,
    ).replace('"src/entities/*.ts"', "[User]"), // Trick to use imported entity
    ");",
].join("\n")

// Helpers
function detectYarnPnp(cwd: string = process.cwd()): PnpDetectionResult {
    if (process.env.YARN_PNP === "1") {
        return {
            isPnpEnabled: true,
            detectionMethod: "environment_variable",
            details: { envVar: process.env.YARN_PNP },
        }
    }

    const pnpJsPath = path.join(cwd, ".pnp.js")
    if (fs.existsSync(pnpJsPath)) {
        return {
            isPnpEnabled: true,
            detectionMethod: "pnp_js_file",
            details: { pnpJsPath },
        }
    }

    const yarnRcYmlPath = path.join(cwd, ".yarnrc.yml")
    if (fs.existsSync(yarnRcYmlPath)) {
        try {
            const content = fs.readFileSync(yarnRcYmlPath, "utf8")
            if (
                content.includes("pnpEnable: true") ||
                content.includes('pnpEnable: "true"') ||
                content.includes("nodeLinker: pnp") ||
                content.includes('nodeLinker: "pnp"')
            ) {
                return {
                    isPnpEnabled: true,
                    detectionMethod: "yarnrc_yml",
                    details: { yarnRcYmlPath },
                }
            }
        } catch {
            // Ignore read errors
        }
    }

    const yarnCachePath = path.join(cwd, ".yarn", "cache")
    if (fs.existsSync(yarnCachePath)) {
        return {
            isPnpEnabled: true,
            detectionMethod: "yarn_cache",
            details: { yarnCachePath },
        }
    }

    return {
        isPnpEnabled: false,
        detectionMethod: "none_detected",
    }
}

function getCleanEnv() {
    const env = { ...process.env }

    // We remove all variables specific to Yarn or NPM that could cause pollution and Yarn PnP to stop working.
    Object.keys(env).forEach((key) => {
        if (
            key.startsWith("npm_") ||
            key.startsWith("YARN_") ||
            key.startsWith("BERRY_")
        ) {
            delete env[key]
        }
    })

    // Only reinject what is necessary for Yarn PnP.
    env.YARN_IGNORE_PATH = "1"
    // Important for Windows/Linux: ensure that PATH is correct
    env.PATH = process.env.PATH

    return env
}

function executeNativeCmd(
    command: string,
    args: readonly string[],
    options: SpawnSyncOptionsWithStringEncoding,
) {
    const executionResult = spawnSync(command, args, {
        ...options,
        env: {
            ...getCleanEnv(),
            ...(options.env || {}),
        },
    })
    if (executionResult.status !== 0) {
        console.error(executionResult)
    }

    return executionResult
}

describe("github issues > #11875 Yarn PnP support for TypeORM CLI", () => {
    before(() => {
        if (fs.existsSync(subProjectTestDir)) {
            execSync(`rm -rf ${subProjectTestDir}`)
        }
        fs.mkdirSync(subProjectTestDir, { recursive: true })

        if (fs.existsSync(testPackageCopyDir)) {
            execSync(`rm -rf ${testPackageCopyDir}`)
        }
        fs.mkdirSync(testPackageCopyDir, { recursive: true })

        // Compile the project using npm run package
        const packagingResult = executeNativeCmd("npm", ["run", "package"], {
            cwd: typeormRootProjectDir,
            encoding: "utf8",
            stdio: "pipe",
        })

        // Verify packaging succeeded
        expect(packagingResult.error, "Packaging typeorm project failed").to.be
            .undefined
        expect(
            packagingResult.status,
            "Packaging typeorm project failed",
        ).to.equal(0)

        // Verify the package directory was created
        expect(
            fs.existsSync(typeormCompiledPackageDir),
            "Packaging typeorm project failed, dir not created",
        ).to.be.true

        // Copy the compiled package to the test package copy directory
        if (fs.existsSync(typeormCompiledPackageDir)) {
            execSync(
                `cp -r ${typeormCompiledPackageDir}/* ${testPackageCopyDir}`,
            )
        }
        // Verify files were copied to the test package directory
        expect(
            fs.existsSync(testPackageCopyDir),
            "Unable to copy the typeorm package to local test folder",
        ).to.be.true

        // Installing and enabling corepack following Yarn official documentation
        executeNativeCmd("npm", ["install", "-g", "corepack"], {
            cwd: subProjectTestDir,
            encoding: "utf8",
            stdio: "pipe",
        })

        executeNativeCmd("corepack", ["enable"], {
            cwd: subProjectTestDir,
            encoding: "utf8",
            stdio: "pipe",
        })

        // Check yarn version installed
        const yarnVersionResult = executeNativeCmd("yarn", ["-v"], {
            cwd: subProjectTestDir,
            encoding: "utf8",
            stdio: "pipe",
        })

        const actualVersion = yarnVersionResult.stdout.trim()
        const comparison = actualVersion.localeCompare(
            yarnMinVersion,
            undefined,
            { numeric: true, sensitivity: "base" },
        )

        expect(yarnVersionResult.error, "Unable to check yarn version").to.be
            .undefined
        expect(
            yarnVersionResult.status,
            "Unable to check yarn version",
        ).to.equal(0)
        expect(
            comparison,
            `Yarn version too old (${actualVersion} < ${yarnMinVersion})`,
        ).to.be.at.least(0)

        const depsInstallResult = executeNativeCmd("npm", ["install"], {
            cwd: typeormRootProjectDir,
            encoding: "utf8",
            stdio: "pipe",
        })

        expect(
            depsInstallResult.error,
            "Unable to reinstall typeorm package dependencies",
        ).to.be.undefined
        expect(
            depsInstallResult.status,
            "Unable to reinstall typeorm package dependencies",
        ).to.equal(0)

        const compileResult = executeNativeCmd("npm", ["run", "compile"], {
            cwd: typeormRootProjectDir,
            encoding: "utf8",
            stdio: "pipe",
        })

        // Verify compilation succeeded
        expect(
            compileResult.error,
            "Unable to recompile typeorm for next tests",
        ).to.be.undefined
        expect(
            compileResult.status,
            "Unable to recompile typeorm for next tests",
        ).to.equal(0)
    })

    // after(() => {
    //     if (fs.existsSync(subProjectTestDir)) {
    //         execSync(`rm -rf ${subProjectTestDir}`)
    //     }

    //     if (fs.existsSync(testPackageCopyDir)) {
    //         execSync(`rm -rf ${testPackageCopyDir}`)
    //     }
    // })

    describe("PnP Detection Utilities", () => {
        let existsSyncStub: sinon.SinonStub
        let readFileSyncStub: sinon.SinonStub

        beforeEach(() => {
            // Create stubs using replace to avoid non-configurable property errors
            const existsSyncOriginal = fs.existsSync
            const readFileSyncOriginal = fs.readFileSync

            existsSyncStub = sinon.stub().callsFake(() => false)
            readFileSyncStub = sinon.stub().callsFake(() => "")

            // Store originals for restoration
            ;(
                existsSyncStub as unknown as { original: typeof fs.existsSync }
            ).original = existsSyncOriginal
            ;(
                readFileSyncStub as unknown as {
                    original: typeof fs.readFileSync
                }
            ).original = readFileSyncOriginal

            // Replace the functions by reassigning to module.exports
            const fsModule = fs as typeof fs & { [key: string]: unknown }
            fsModule.existsSync =
                existsSyncStub as unknown as typeof fs.existsSync
            fsModule.readFileSync =
                readFileSyncStub as unknown as typeof fs.readFileSync
        })

        afterEach(() => {
            // Restore original functions
            const fsModule = fs as typeof fs & { [key: string]: unknown }
            fsModule.existsSync = (
                existsSyncStub as unknown as { original: typeof fs.existsSync }
            ).original
            fsModule.readFileSync = (
                readFileSyncStub as unknown as {
                    original: typeof fs.readFileSync
                }
            ).original

            // No need to call restore() on manually created stubs
        })

        it("should detect Yarn PnP from environment variable (mocked)", () => {
            const originalYarnPnp = process.env.YARN_PNP
            process.env.YARN_PNP = "1"

            const result = detectYarnPnp()
            expect(result.isPnpEnabled).to.be.true
            expect(result.detectionMethod).to.equal("environment_variable")
            // Environment variable takes precedence, so fs functions shouldn't be called
            sinon.assert.notCalled(existsSyncStub)
            sinon.assert.notCalled(readFileSyncStub)
            process.env.YARN_PNP = originalYarnPnp
        })

        it("should detect Yarn PnP from .pnp.js file (mocked)", () => {
            // Replace the stub with a function that returns true for .pnp.js files
            existsSyncStub.callsFake((path: string) => path.endsWith(".pnp.js"))

            const result = detectYarnPnp("/fake/path")
            expect(result.isPnpEnabled).to.be.true
            expect(result.detectionMethod).to.equal("pnp_js_file")
            expect(result.details?.pnpJsPath).to.include(".pnp.js")
        })

        it("should detect Yarn PnP from .yarnrc.yml with pnpEnable: true (mocked)", () => {
            // Replace stubs to simulate .yarnrc.yml with pnpEnable: true
            existsSyncStub.callsFake((path: string) =>
                path.includes(".yarnrc.yml"),
            )
            readFileSyncStub.callsFake((path: string) => {
                if (path.includes(".yarnrc.yml"))
                    return "pnpEnable: true\npnpMode: strict"
                return ""
            })

            const result = detectYarnPnp("/fake/path")
            expect(result.isPnpEnabled).to.be.true
            expect(result.detectionMethod).to.equal("yarnrc_yml")
        })

        it("should detect Yarn PnP from .yarnrc.yml with pnpEnable: false (mocked)", () => {
            // Replace stubs to simulate .yarnrc.yml with pnpEnable: false
            existsSyncStub.callsFake((path: string) =>
                path.includes(".yarnrc.yml"),
            )
            readFileSyncStub.callsFake((path: string) => {
                if (path.includes(".yarnrc.yml")) return "pnpEnable: false"
                return ""
            })

            const result = detectYarnPnp("/fake/path")
            expect(result.isPnpEnabled).to.be.false
            expect(result.detectionMethod).to.equal("none_detected")
        })

        it("should detect Yarn PnP from yarn cache (mocked)", () => {
            // Replace stub to simulate yarn cache existence
            existsSyncStub.callsFake((path: string) =>
                path.includes(".yarn/cache"),
            )

            const result = detectYarnPnp("/fake/path")
            expect(result.isPnpEnabled).to.be.true
            expect(result.detectionMethod).to.equal("yarn_cache")
        })

        it("should return false when no PnP indicators found (mocked)", () => {
            // Keep default stub that returns false for all paths
            existsSyncStub.callsFake(() => false)

            const result = detectYarnPnp("/fake/path")
            expect(result.isPnpEnabled).to.be.false
            expect(result.detectionMethod).to.equal("none_detected")
        })

        it("should handle readFileSync error gracefully (mocked)", () => {
            // Replace stubs to simulate read error on .yarnrc.yml
            existsSyncStub.callsFake((path: string) =>
                path.includes(".yarnrc.yml"),
            )
            readFileSyncStub.callsFake((path: string) => {
                if (path.includes(".yarnrc.yml")) throw new Error("Read error")
                return ""
            })

            const result = detectYarnPnp("/fake/path")
            expect(result.isPnpEnabled).to.be.false
            expect(result.detectionMethod).to.equal("none_detected")
        })
    })

    describe("In a CommonJS Javascript project with Yarn PnP", () => {
        after(() => {
            if (fs.existsSync(subProjectTestDir)) {
                execSync(`rm -rf ${subProjectTestDir}`)
            }
        })

        it("should generate a minimal Yarn PnP project structure and install dependencies", () => {
            fs.mkdirSync(subProjectTestDir, { recursive: true })
            fs.mkdirSync(subProjectTestSrcDir, { recursive: true })
            fs.mkdirSync(subProjectTestEntitiesDir, { recursive: true })
            fs.mkdirSync(subProjectTestMigrationsDirPath, { recursive: true })

            // Generate the .yarnrc.yml to setup Yarn PnP
            fs.writeFileSync(yarnrcYmlPath, yarnrcYml)

            // Generate the package.json
            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJsonCjsProject, null, 2),
            )

            // Generate an empty yarn.lock file to make the project independant
            fs.writeFileSync(yarnLockPath, "")

            // Utilisation du contenu CJS pour l'entité
            fs.writeFileSync(entityJsFilePath, entityCjsContent)

            // Generate a basic Migration file
            fs.writeFileSync(
                path.join(
                    subProjectTestMigrationsDirPath,
                    "1767365791032-InitialMigration.js",
                ),
                validCjsMigrationContent,
            )

            // Create ormconfig.js based on ormconfig.sample.json
            fs.writeFileSync(ormConfigJsPath, ormConfigCjsContent)

            // Run yarn install to verify PnP setup works
            const installResult = executeNativeCmd(
                "yarn",
                ["install", "--refresh-lockfile"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                    stdio: "pipe",
                },
            )

            expect(
                installResult.error,
                "Test project installation has an error",
            ).to.be.undefined
            expect(
                installResult.status,
                "Test project installation has an error",
            ).to.equal(0)

            // Verify files were created
            expect(
                fs.existsSync(yarnrcYmlPath),
                ".yarnrc.yml does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(packageJsonPath),
                "package.json does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(yarnLockPath),
                "yarn.lock does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(entityJsFilePath),
                "Entity file does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(ormConfigJsPath),
                "ormconfig.js does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.cjs")),
                ".pnp.cjs does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.loader.mjs")),
                ".pnp.loader.mjs does not exists in test project",
            ).to.be.true
        })

        it("should pass Yarn PnP checks", () => {
            const detectionResult = detectYarnPnp(subProjectTestDir)
            expect(detectionResult.isPnpEnabled).to.be.true
        })

        it("should handle module resolution require", () => {
            const javascriptCode = [
                `try {`,
                `    require('typeorm');`,
                `    console.log('SUCCESS')`,
                `} catch (e) {`,
                `    console.log('FAIL:', e.message);`,
                `    process.exit(1)`,
                `}`,
            ].join("\n")
            const result = executeNativeCmd(
                "node",
                ["--require", "./.pnp.cjs", "-e", javascriptCode],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("SUCCESS")
        })

        it("should return help on basic cli call", () => {
            const result = executeNativeCmd("yarn", ["typeorm", "--help"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
            })

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("Usage")
        })

        it("should handle entity generation using CLI", () => {
            const result = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "entity:create",
                    `${subProjectTestEntitiesDir}/TestEntity`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            fs.unlinkSync(path.join(subProjectTestEntitiesDir, "TestEntity.ts")) // Typeorm generate only Typescript files
        })

        it("should create migrations using CLI", () => {
            const migrationResult = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "migration:create",
                    `${migrationsDirRelativePath}/InitialMigration`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(migrationResult.error).to.be.undefined
            expect(migrationResult.status).to.equal(0)

            // Check that migration file was created
            expect(fs.existsSync(subProjectTestMigrationsDirPath)).to.be.true
            const migrationFiles = fs.readdirSync(
                subProjectTestMigrationsDirPath,
            )
            expect(migrationFiles.length).to.equal(2)
            const migrationGeneratedFile =
                migrationFiles.find((filename) => filename.endsWith(".ts")) ||
                ""
            expect(migrationGeneratedFile).to.not.be.undefined
            fs.unlinkSync(
                path.join(
                    subProjectTestMigrationsDirPath,
                    migrationGeneratedFile, // Typeorm generate only Typescript files
                ),
            )
        })

        it("should apply migrations using CLI", () => {
            const applyResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:run", "--dataSource", "ormconfig.js"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(applyResult.error).to.be.undefined
            expect(applyResult.status).to.equal(0)
        })

        it("should revert and clean migration using CLI", () => {
            const execResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:revert", "--dataSource", "ormconfig.js"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(execResult.error).to.be.undefined
            expect(execResult.status).to.equal(0)

            fs.rmSync(subProjectTestMigrationsDirPath, { recursive: true })
        })
    })

    describe("In a CommonJS TypeScript project with Yarn PnP", () => {
        after(() => {
            if (fs.existsSync(subProjectTestDir)) {
                execSync(`rm -rf ${subProjectTestDir}`)
            }
        })

        it("should generate a minimal Yarn PnP project structure and install dependencies", () => {
            // Generate tests artifacts folders
            fs.mkdirSync(subProjectTestDir, { recursive: true })
            fs.mkdirSync(subProjectTestSrcDir, { recursive: true })
            fs.mkdirSync(subProjectTestEntitiesDir, { recursive: true })
            fs.mkdirSync(subProjectTestMigrationsDirPath, { recursive: true })

            // Generate the .yarnrc.yml to setup Yarn PnP
            fs.writeFileSync(yarnrcYmlPath, yarnrcYml)

            // Generate the package.json
            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJsonTsCjsProject, null, 2),
            )

            // Generate an empty yarn.lock file to make the project independant
            fs.writeFileSync(yarnLockPath, "")

            // Generate tsconfig.json file
            fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfigCjs, null, 2))

            // Generate a basic Entity file
            fs.writeFileSync(entityTsFilePath, entityTsContent)

            // Create ormconfig.ts based on ormconfig.sample.json
            fs.writeFileSync(ormConfigTsPath, ormConfigContent)

            // Run yarn install to verify PnP setup works
            const installResult = executeNativeCmd("yarn", ["install"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
                stdio: "pipe",
            })

            expect(installResult.error).to.be.undefined
            expect(installResult.status).to.equal(0)

            // Verify files were created
            expect(
                fs.existsSync(yarnrcYmlPath),
                ".yarnrc.yml does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(packageJsonPath),
                "package.json does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(yarnLockPath),
                "yarn.lock does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(entityTsFilePath),
                "Entity file does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(ormConfigTsPath),
                "ormconfig.js does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.cjs")),
                ".pnp.cjs does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.loader.mjs")),
                ".pnp.loader.mjs does not exists in test project",
            ).to.be.true
        })

        it("should pass Yarn PnP check", () => {
            const detectionResult = detectYarnPnp(subProjectTestDir)
            expect(detectionResult.isPnpEnabled).to.be.true
        })

        it("should handle module resolution import", () => {
            const javascriptCode = [
                `try {`,
                `    require('typeorm');`,
                `    console.log('SUCCESS')`,
                `} catch (e) {`,
                `    console.log('FAIL:', e.message);`,
                `    process.exit(1)`,
                `}`,
            ].join("\n")
            const result = executeNativeCmd(
                "node",
                [
                    "--require",
                    "./.pnp.cjs",
                    "--require",
                    "ts-node/register",
                    "-e",
                    javascriptCode,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("SUCCESS")
        })

        it("should return help on basic cli call", () => {
            const result = executeNativeCmd("yarn", ["typeorm", "--help"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
            })

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("Usage")
        })

        it("should generate entity using CLI", () => {
            const result = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "entity:create",
                    `${subProjectTestEntitiesDir}/TestEntity`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            fs.unlinkSync(path.join(subProjectTestEntitiesDir, "TestEntity.ts")) // Remove unecessary empty file for next tests
        })

        it("should generate migrations using CLI", () => {
            const migrationResult = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "migration:generate",
                    `${migrationsDirRelativePath}/InitialMigration`,
                    "--dataSource",
                    "ormconfig.ts",
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(migrationResult.error).to.be.undefined
            expect(migrationResult.status).to.equal(0)

            // Check that migration file was created
            expect(fs.existsSync(subProjectTestMigrationsDirPath)).to.be.true
            const migrationFiles = fs.readdirSync(
                subProjectTestMigrationsDirPath,
            )
            expect(
                migrationFiles.length,
                `No migration files in ${subProjectTestMigrationsDirPath}`,
            ).to.be.greaterThan(0)
        })

        it("should apply migrations using CLI", () => {
            const applyResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:run", "--dataSource", "ormconfig.ts"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(applyResult.error).to.be.undefined
            expect(applyResult.status).to.equal(0)
        })

        it("should revert and clean migrations using CLI", () => {
            const execResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:revert", "--dataSource", "ormconfig.ts"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(execResult.error).to.be.undefined
            expect(execResult.status).to.equal(0)

            fs.rmSync(subProjectTestMigrationsDirPath, { recursive: true })
        })
    })

    describe("In an ESM Javascript project with Yarn PnP", () => {
        after(() => {
            if (fs.existsSync(subProjectTestDir)) {
                execSync(`rm -rf ${subProjectTestDir}`)
            }
        })

        it("should generate a minimal Yarn PnP project structure and install dependencies", () => {
            // Generate tests artifacts folders
            fs.mkdirSync(subProjectTestDir, { recursive: true })
            fs.mkdirSync(subProjectTestSrcDir, { recursive: true })
            fs.mkdirSync(subProjectTestEntitiesDir, { recursive: true })
            fs.mkdirSync(subProjectTestMigrationsDirPath, { recursive: true })

            // Generate the .yarnrc.yml to setup Yarn PnP
            fs.writeFileSync(yarnrcYmlPath, yarnrcYml)

            // Generate the package.json
            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJsonJsProject, null, 2),
            )

            // Generate an empty yarn.lock file to make the project independant
            fs.writeFileSync(yarnLockPath, "")

            // Generate a basic Entity file
            fs.writeFileSync(entityJsFilePath, entityJsContent)

            // Generate a basic Migration file
            fs.writeFileSync(
                path.join(
                    subProjectTestMigrationsDirPath,
                    "1767365791032-InitialMigration.js",
                ),
                validJsMigrationContent,
            )

            // Create ormconfig.js based on ormconfig.sample.json
            fs.writeFileSync(ormConfigJsPath, ormConfigContent)

            // Run yarn install to verify PnP setup works
            const installResult = executeNativeCmd(
                "yarn",
                ["install", "--refresh-lockfile"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                    stdio: "pipe",
                },
            )

            expect(
                installResult.error,
                "Test project installation has an error",
            ).to.be.undefined
            expect(
                installResult.status,
                "Test project installation has an error",
            ).to.equal(0)

            // Verify files were created
            expect(
                fs.existsSync(yarnrcYmlPath),
                ".yarnrc.yml does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(packageJsonPath),
                "package.json does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(yarnLockPath),
                "yarn.lock does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(entityJsFilePath),
                "Entity file does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(ormConfigJsPath),
                "ormconfig.js does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.cjs")),
                ".pnp.cjs does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.loader.mjs")),
                ".pnp.loader.mjs does not exists in test project",
            ).to.be.true
        })

        it("should pass Yarn PnP checks", () => {
            const detectionResult = detectYarnPnp(subProjectTestDir)
            expect(detectionResult.isPnpEnabled).to.be.true
        })

        it("should handle module resolution import", () => {
            const javascriptCode = [
                `try {`,
                `    import('typeorm');`,
                `    console.log('SUCCESS')`,
                `} catch (e) {`,
                `    console.log('FAIL:', e.message);`,
                `    process.exit(1)`,
                `}`,
            ].join("\n")
            const result = executeNativeCmd(
                "node",
                [
                    "--loader",
                    "./.pnp.loader.mjs",
                    "--no-warnings",
                    "-e",
                    javascriptCode,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("SUCCESS")
        })

        it("should return help on basic cli call", () => {
            const result = executeNativeCmd("yarn", ["typeorm", "--help"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
            })

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("Usage")
        })

        it("should handle entity generation using CLI", () => {
            const result = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "entity:create",
                    `${subProjectTestEntitiesDir}/TestEntity`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            fs.unlinkSync(path.join(subProjectTestEntitiesDir, "TestEntity.ts")) // Typeorm generate only Typescript files
        })

        it("should create migrations using CLI", () => {
            const migrationResult = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "migration:create",
                    `${migrationsDirRelativePath}/InitialMigration`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(migrationResult.error).to.be.undefined
            expect(migrationResult.status).to.equal(0)

            // Check that migration file was created
            expect(fs.existsSync(subProjectTestMigrationsDirPath)).to.be.true
            const migrationFiles = fs.readdirSync(
                subProjectTestMigrationsDirPath,
            )
            expect(migrationFiles.length).to.equal(2)
            const migrationGeneratedFile =
                migrationFiles.find((filename) => filename.endsWith(".ts")) ||
                ""
            expect(migrationGeneratedFile).to.not.be.undefined
            fs.unlinkSync(
                path.join(
                    subProjectTestMigrationsDirPath,
                    migrationGeneratedFile, // Typeorm generate only Typescript files
                ),
            )
        })

        it("should apply migrations using CLI", () => {
            const applyResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:run", "--dataSource", "ormconfig.js"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(applyResult.error).to.be.undefined
            expect(applyResult.status).to.equal(0)
        })

        it("should revert and clean migration using CLI", () => {
            const execResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:revert", "--dataSource", "ormconfig.js"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(execResult.error).to.be.undefined
            expect(execResult.status).to.equal(0)

            fs.rmSync(subProjectTestMigrationsDirPath, { recursive: true })
        })
    })

    describe("In an ESM TypeScript project with Yarn PnP", () => {
        after(() => {
            if (fs.existsSync(subProjectTestDir)) {
                execSync(`rm -rf ${subProjectTestDir}`)
            }
        })

        it("should generate a minimal Yarn PnP project structure and install dependencies", () => {
            // Generate tests artifacts folders
            fs.mkdirSync(subProjectTestDir, { recursive: true })
            fs.mkdirSync(subProjectTestSrcDir, { recursive: true })
            fs.mkdirSync(subProjectTestEntitiesDir, { recursive: true })
            fs.mkdirSync(subProjectTestMigrationsDirPath, { recursive: true })

            // Generate the .yarnrc.yml to setup Yarn PnP
            fs.writeFileSync(yarnrcYmlPath, yarnrcYml)

            // Generate the package.json
            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJsonTsProject, null, 2),
            )

            // Generate an empty yarn.lock file to make the project independant
            fs.writeFileSync(yarnLockPath, "")

            // Generate tsconfig.json file
            fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))

            // Generate a basic Entity file
            fs.writeFileSync(entityTsFilePath, entityTsContent)

            // Create ormconfig.ts based on ormconfig.sample.json
            fs.writeFileSync(ormConfigTsPath, ormConfigContent)

            // Run yarn install to verify PnP setup works
            const installResult = executeNativeCmd("yarn", ["install"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
                stdio: "pipe",
            })

            expect(installResult.error).to.be.undefined
            expect(installResult.status).to.equal(0)

            // Verify files were created
            expect(
                fs.existsSync(yarnrcYmlPath),
                ".yarnrc.yml does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(packageJsonPath),
                "package.json does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(yarnLockPath),
                "yarn.lock does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(entityTsFilePath),
                "Entity file does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(ormConfigTsPath),
                "ormconfig.js does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.cjs")),
                ".pnp.cjs does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.loader.mjs")),
                ".pnp.loader.mjs does not exists in test project",
            ).to.be.true
        })

        it("should pass Yarn PnP check", () => {
            const detectionResult = detectYarnPnp(subProjectTestDir)
            expect(detectionResult.isPnpEnabled).to.be.true
        })

        it("should handle module resolution import", () => {
            const typescriptCode = [
                `try {`,
                `    import('typeorm');`,
                `    console.log('SUCCESS')`,
                `} catch (e) {`,
                `    console.log('FAIL:', e.message);`,
                `    process.exit(1)`,
                `}`,
            ].join("\n")
            const result = executeNativeCmd(
                "node",
                [
                    "--loader",
                    "./.pnp.loader.mjs",
                    "--no-warnings",
                    "-e",
                    typescriptCode,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("SUCCESS")
        })

        it("should return help on basic cli call", () => {
            const result = executeNativeCmd("yarn", ["typeorm", "--help"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
            })

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("Usage")
        })

        it("should generate entity using CLI", () => {
            const result = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "entity:create",
                    `${subProjectTestEntitiesDir}/TestEntity`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            fs.unlinkSync(path.join(subProjectTestEntitiesDir, "TestEntity.ts")) // Remove unecessary empty file for next tests
        })

        it("should generate migrations using CLI", () => {
            const migrationResult = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "migration:generate",
                    `${migrationsDirRelativePath}/InitialMigration`,
                    "--dataSource",
                    "ormconfig.ts",
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(migrationResult.error).to.be.undefined
            expect(migrationResult.status).to.equal(0)

            // Check that migration file was created
            expect(fs.existsSync(subProjectTestMigrationsDirPath)).to.be.true
            const migrationFiles = fs.readdirSync(
                subProjectTestMigrationsDirPath,
            )
            expect(
                migrationFiles.length,
                `No migration files in ${subProjectTestMigrationsDirPath}`,
            ).to.be.greaterThan(0)
        })

        it("should apply migrations using CLI", () => {
            const applyResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:run", "--dataSource", "ormconfig.ts"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(applyResult.error).to.be.undefined
            expect(applyResult.status).to.equal(0)
        })

        it("should revert and clean migrations using CLI", () => {
            const execResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:revert", "--dataSource", "ormconfig.ts"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(execResult.error).to.be.undefined
            expect(execResult.status).to.equal(0)

            fs.rmSync(subProjectTestMigrationsDirPath, { recursive: true })
        })
    })

    describe("In an ESM TypeScript project with Yarn PnP and Path Aliases (@/src)", () => {
        it("should generate a minimal Yarn PnP project structure with Path Aliases", () => {
            // Generate tests artifacts folders
            fs.mkdirSync(subProjectTestDir, { recursive: true })
            fs.mkdirSync(subProjectTestSrcDir, { recursive: true })
            fs.mkdirSync(subProjectTestEntitiesDir, { recursive: true })
            fs.mkdirSync(subProjectTestMigrationsDirPath, { recursive: true })

            // Generate the .yarnrc.yml to setup Yarn PnP
            fs.writeFileSync(yarnrcYmlPath, yarnrcYml)

            // Generate the package.json
            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJsonTsAliasProject, null, 2),
            )

            // Generate an empty yarn.lock file to make the project independant
            fs.writeFileSync(yarnLockPath, "")

            // Generate tsconfig.json file
            fs.writeFileSync(
                tsConfigPath,
                JSON.stringify(tsConfigAlias, null, 2),
            )

            // Generate custom loader
            fs.writeFileSync(aliasLoader, aliasLoaderContent)

            // Generate a basic Entity file
            fs.writeFileSync(entityTsFilePath, entityTsContent)

            // Create ormconfig.ts based on ormconfig.sample.json
            fs.writeFileSync(ormConfigTsPath, ormConfigAliasContent)

            // Run yarn install to verify PnP setup works
            const installResult = executeNativeCmd("yarn", ["install"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
                stdio: "pipe",
            })

            expect(installResult.error).to.be.undefined
            expect(installResult.status).to.equal(0)

            // Verify files were created
            expect(
                fs.existsSync(yarnrcYmlPath),
                ".yarnrc.yml does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(packageJsonPath),
                "package.json does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(yarnLockPath),
                "yarn.lock does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(entityTsFilePath),
                "Entity file does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(ormConfigTsPath),
                "ormconfig.js does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.cjs")),
                ".pnp.cjs does not exists in test project",
            ).to.be.true
            expect(
                fs.existsSync(path.join(subProjectTestDir, ".pnp.loader.mjs")),
                ".pnp.loader.mjs does not exists in test project",
            ).to.be.true
        })

        it("should pass Yarn PnP check", () => {
            const detectionResult = detectYarnPnp(subProjectTestDir)
            expect(detectionResult.isPnpEnabled).to.be.true
        })

        it("should handle module resolution import with alias", () => {
            const testScriptPath = path.join(subProjectTestDir, "test-alias.ts")
            const testScriptContent = [
                'import { DataSource } from "typeorm";',
                'import { User } from "@/entities/User";',
                "",
                'console.log("TypeORM DataSource loaded:", DataSource ? "YES" : "NO");',
                'console.log("Alias User loaded:", User ? "YES" : "NO");',
            ].join("\n")
            fs.writeFileSync(testScriptPath, testScriptContent)

            const result = executeNativeCmd(
                "node",
                [
                    "--require",
                    "./.pnp.cjs",
                    "--loader",
                    "./alias-loader.mjs",
                    "--loader",
                    "ts-node/esm",
                    "--loader",
                    "./.pnp.loader.mjs",
                    "--no-warnings",
                    testScriptPath,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("TypeORM DataSource loaded: YES")
            expect(result.stdout).to.include("Alias User loaded: YES")
        })

        it("should return help on basic cli call", () => {
            const result = executeNativeCmd("yarn", ["typeorm", "--help"], {
                cwd: subProjectTestDir,
                encoding: "utf8",
            })

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            expect(result.stdout).to.include("Usage")
        })

        it("should generate entity using CLI", () => {
            const result = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "entity:create",
                    `${subProjectTestEntitiesDir}/TestEntity`,
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(result.error).to.be.undefined
            expect(result.status).to.equal(0)
            fs.unlinkSync(path.join(subProjectTestEntitiesDir, "TestEntity.ts")) // Remove unecessary empty file for next tests
        })

        it("should generate migrations using CLI with alias-based setup", () => {
            const migrationResult = executeNativeCmd(
                "yarn",
                [
                    "typeorm",
                    "migration:generate",
                    `${migrationsDirRelativePath}/AliasMigration`,
                    "--dataSource",
                    "ormconfig.ts",
                ],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(migrationResult.error).to.be.undefined
            expect(migrationResult.status).to.equal(0)

            // Check that migration file was created
            expect(fs.existsSync(subProjectTestMigrationsDirPath)).to.be.true
            const migrationFiles = fs.readdirSync(
                subProjectTestMigrationsDirPath,
            )
            expect(
                migrationFiles.length,
                `No migration files in ${subProjectTestMigrationsDirPath}`,
            ).to.be.greaterThan(0)
        })

        it("should apply migrations using CLI", () => {
            const applyResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:run", "-d", "ormconfig.ts"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(applyResult.error).to.be.undefined
            expect(applyResult.status).to.equal(0)
        })

        it("should revert and clean migrations using CLI", () => {
            const execResult = executeNativeCmd(
                "yarn",
                ["typeorm", "migration:revert", "-d", "ormconfig.ts"],
                {
                    cwd: subProjectTestDir,
                    encoding: "utf8",
                },
            )

            expect(execResult.error).to.be.undefined
            expect(execResult.status).to.equal(0)

            fs.rmSync(subProjectTestMigrationsDirPath, { recursive: true })
        })
    })
})
