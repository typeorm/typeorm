import ansi from "ansis"
import { exec } from "child_process"
import path from "path"
import yargs from "yargs"
import { TypeORMError } from "../error"
import { PlatformTools } from "../platform/PlatformTools"
import { CommandUtils } from "./CommandUtils"

import ourPackageJson from "../../package.json"

/**
 * Generates a new project with TypeORM.
 */
export class InitCommand implements yargs.CommandModule {
    command = "init"
    describe =
        "Generates initial TypeORM project structure. " +
        "If name specified then creates files inside directory called as name. " +
        "If its not specified then creates files inside current directory."

    builder(args: yargs.Argv) {
        return args
            .option("n", {
                alias: "name",
                describe: "Name of the project directory.",
            })
            .option("db", {
                alias: "database",
                describe: "Database type you'll use in your project.",
            })
            .option("express", {
                describe:
                    "Indicates if express server sample code should be included in the project. False by default.",
            })
            .option("docker", {
                describe:
                    "Set to true if docker-compose must be generated as well. False by default.",
            })
            .option("pm", {
                alias: "manager",
                choices: ["npm", "yarn"],
                default: "npm",
                describe: "Install packages, expected values are npm or yarn.",
            })
            .option("ms", {
                alias: "module",
                choices: ["commonjs", "esm"],
                default: "commonjs",
                describe:
                    "Module system to use for project, expected values are commonjs or esm.",
            })
    }

    async handler(args: yargs.Arguments) {
        try {
            const database: string = (args.database as any) || "postgres"
            const isExpress = args.express !== undefined ? true : false
            const isDocker = args.docker !== undefined ? true : false
            const basePath = process.cwd() + (args.name ? "/" + args.name : "")
            const projectName = args.name
                ? path.basename(args.name as any)
                : undefined
            const installNpm = args.pm === "yarn" ? false : true
            const projectIsEsm = args.ms === "esm"
            await CommandUtils.createFile(
                basePath + "/package.json",
                InitCommand.getPackageJsonTemplate(projectName, projectIsEsm),
                false,
            )
            if (isDocker)
                await CommandUtils.createFile(
                    basePath + "/docker-compose.yml",
                    InitCommand.getDockerComposeTemplate(database),
                    false,
                )
            await CommandUtils.createFile(
                basePath + "/.gitignore",
                InitCommand.getGitIgnoreFile(),
            )
            await CommandUtils.createFile(
                basePath + "/README.md",
                InitCommand.getReadmeTemplate({ docker: isDocker }),
                false,
            )
            await CommandUtils.createFile(
                basePath + "/tsconfig.json",
                InitCommand.getTsConfigTemplate(projectIsEsm),
            )
            await CommandUtils.createFile(
                basePath + "/src/entity/User.ts",
                InitCommand.getUserEntityTemplate(database),
            )
            await CommandUtils.createFile(
                basePath + "/src/data-source.ts",
                InitCommand.getAppDataSourceTemplate(projectIsEsm, database),
            )
            await CommandUtils.createFile(
                basePath + "/src/index.ts",
                InitCommand.getAppIndexTemplate(isExpress, projectIsEsm),
            )
            await CommandUtils.createDirectories(basePath + "/src/migration")

            // generate extra files for express application
            if (isExpress) {
                await CommandUtils.createFile(
                    basePath + "/src/routes.ts",
                    InitCommand.getRoutesTemplate(projectIsEsm),
                )
                await CommandUtils.createFile(
                    basePath + "/src/controller/UserController.ts",
                    InitCommand.getControllerTemplate(projectIsEsm),
                )
            }

            const packageJsonContents = await CommandUtils.readFile(
                basePath + "/package.json",
            )
            await CommandUtils.createFile(
                basePath + "/package.json",
                InitCommand.appendPackageJson(
                    packageJsonContents,
                    database,
                    isExpress,
                    projectIsEsm,
                ),
            )

            if (args.name) {
                console.log(
                    ansi.green`Project created inside ${ansi.blue(
                        basePath,
                    )} directory.`,
                )
            } else {
                console.log(
                    ansi.green`Project created inside current directory.`,
                )
            }

            console.log(ansi.green`Please wait, installing dependencies...`)
            if (args.pm && installNpm) {
                await InitCommand.executeCommand("npm install", basePath)
            } else {
                await InitCommand.executeCommand("yarn install", basePath)
            }

            console.log(ansi.green`Done! Start playing with a new project!`)
        } catch (err) {
            PlatformTools.logCmdErr("Error during project initialization:", err)
            process.exit(1)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    protected static executeCommand(command: string, cwd: string) {
        return new Promise<string>((ok, fail) => {
            exec(command, { cwd }, (error: any, stdout: any, stderr: any) => {
                if (stdout) return ok(stdout)
                if (stderr) return fail(stderr)
                if (error) return fail(error)
                ok("")
            })
        })
    }

    /**
     * Gets contents of the ormconfig file.
     */
    protected static getAppDataSourceTemplate(
        isEsm: boolean,
        database: string,
    ): string {
        let dbSettings = ""
        switch (database) {
            case "mysql":
                dbSettings = `type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",`
                break
            case "mariadb":
                dbSettings = `type: "mariadb",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",`
                break
            case "sqlite":
                dbSettings = `type: "sqlite",
    database: "database.sqlite",`
                break
            case "better-sqlite3":
                dbSettings = `type: "better-sqlite3",
    database: "database.sqlite",`
                break
            case "postgres":
                dbSettings = `type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",`
                break
            case "cockroachdb":
                dbSettings = `type: "cockroachdb",
    host: "localhost",
    port: 26257,
    username: "root",
    password: "",
    database: "defaultdb",`
                break
            case "mssql":
                dbSettings = `type: "mssql",
    host: "localhost",
    username: "sa",
    password: "Admin12345",
    database: "tempdb",`
                break
            case "oracle":
                dbSettings = `type: "oracle",
host: "localhost",
username: "system",
password: "oracle",
port: 1521,
sid: "xe.oracle.docker",`
                break
            case "mongodb":
                dbSettings = `type: "mongodb",
    database: "test",`
                break
            case "spanner":
                dbSettings = `type: "spanner",
    projectId: "test",
    instanceId: "test",
    databaseId: "test",`
                break
        }
        return `import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User${isEsm ? ".js" : ""}"

export const AppDataSource = new DataSource({
    ${dbSettings}
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
`
    }

    /**
     * Gets contents of the ormconfig file.
     */
    protected static getTsConfigTemplate(esmModule: boolean): string {
        if (esmModule)
            return JSON.stringify(
                {
                    compilerOptions: {
                        lib: ["es2021"],
                        target: "es2021",
                        module: "es2022",
                        moduleResolution: "node",
                        allowSyntheticDefaultImports: true,
                        outDir: "./build",
                        emitDecoratorMetadata: true,
                        experimentalDecorators: true,
                        sourceMap: true,
                    },
                },
                undefined,
                3,
            )
        else
            return JSON.stringify(
                {
                    compilerOptions: {
                        lib: ["es2021"],
                        target: "es2021",
                        module: "commonjs",
                        moduleResolution: "node",
                        outDir: "./build",
                        emitDecoratorMetadata: true,
                        experimentalDecorators: true,
                        sourceMap: true,
                    },
                },
                undefined,
                3,
            )
    }

    /**
     * Gets contents of the .gitignore file.
     */
    protected static getGitIgnoreFile(): string {
        return `.idea/
.vscode/
node_modules/
build/
tmp/
temp/`
    }

    /**
     * Gets contents of the user entity.
     */
    protected static getUserEntityTemplate(database: string): string {
        return `import { Entity, ${
            database === "mongodb"
                ? "ObjectIdColumn, ObjectId"
                : "PrimaryGeneratedColumn"
        }, Column } from "typeorm"

@Entity()
export class User {

    ${
        database === "mongodb"
            ? "@ObjectIdColumn()"
            : "@PrimaryGeneratedColumn()"
    }
    id: ${database === "mongodb" ? "ObjectId" : "number"}

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number

}
`
    }

    /**
     * Gets contents of the route file (used when express is enabled).
     */
    protected static getRoutesTemplate(isEsm: boolean): string {
        return `import { UserController } from "./controller/UserController${
            isEsm ? ".js" : ""
        }"

export const Routes = [{
    method: "get",
    route: "/users",
    controller: UserController,
    action: "all"
}, {
    method: "get",
    route: "/users/:id",
    controller: UserController,
    action: "one"
}, {
    method: "post",
    route: "/users",
    controller: UserController,
    action: "save"
}, {
    method: "delete",
    route: "/users/:id",
    controller: UserController,
    action: "remove"
}]`
    }

    /**
     * Gets contents of the user controller file (used when express is enabled).
     */
    protected static getControllerTemplate(isEsm: boolean): string {
        return `import { AppDataSource } from "../data-source${
            isEsm ? ".js" : ""
        }"
import { NextFunction, Request, Response } from "express"
import { User } from "../entity/User${isEsm ? ".js" : ""}"

export class UserController {

    private userRepository = AppDataSource.getRepository(User)

    async all(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.find()
    }

    async one(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id)


        const user = await this.userRepository.findOne({
            where: { id }
        })

        if (!user) {
            return "unregistered user"
        }
        return user
    }

    async save(request: Request, response: Response, next: NextFunction) {
        const { firstName, lastName, age } = request.body;

        const user = Object.assign(new User(), {
            firstName,
            lastName,
            age
        })

        return this.userRepository.save(user)
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id)

        let userToRemove = await this.userRepository.findOneBy({ id })

        if (!userToRemove) {
            return "this user not exist"
        }

        await this.userRepository.remove(userToRemove)

        return "user has been removed"
    }

}`
    }

    /**
     * Gets contents of the main (index) application file.
     */
    protected static getAppIndexTemplate(
        express: boolean,
        isEsm: boolean,
    ): string {
        if (express) {
            return `import ${!isEsm ? "* as " : ""}express from "express"
import ${!isEsm ? "* as " : ""}bodyParser from "body-parser"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source${isEsm ? ".js" : ""}"
import { Routes } from "./routes${isEsm ? ".js" : ""}"
import { User } from "./entity/User${isEsm ? ".js" : ""}"

AppDataSource.initialize().then(async () => {

    // create express app
    const app = express()
    app.use(bodyParser.json())

    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next)
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined)

            } else if (result !== null && result !== undefined) {
                res.json(result)
            }
        })
    })

    // setup express app here
    // ...

    // start express server
    app.listen(3000)

    // insert new users for test
    await AppDataSource.manager.save(
        AppDataSource.manager.create(User, {
            firstName: "Timber",
            lastName: "Saw",
            age: 27
        })
    )

    await AppDataSource.manager.save(
        AppDataSource.manager.create(User, {
            firstName: "Phantom",
            lastName: "Assassin",
            age: 24
        })
    )

    console.log("Express server has started on port 3000. Open http://localhost:3000/users to see results")

}).catch(error => console.log(error))
`
        } else {
            return `import { AppDataSource } from "./data-source${
                isEsm ? ".js" : ""
            }"
import { User } from "./entity/User${isEsm ? ".js" : ""}"

AppDataSource.initialize().then(async () => {

    console.log("Inserting a new user into the database...")
    const user = new User()
    user.firstName = "Timber"
    user.lastName = "Saw"
    user.age = 25
    await AppDataSource.manager.save(user)
    console.log("Saved a new user with id: " + user.id)

    console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(User)
    console.log("Loaded users: ", users)

    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))
`
        }
    }

    /**
     * Gets contents of the new package.json file.
     */
    protected static getPackageJsonTemplate(
        projectName?: string,
        projectIsEsm?: boolean,
    ): string {
        return JSON.stringify(
            {
                name: projectName || "typeorm-sample",
                version: "0.0.1",
                description: "Awesome project developed with TypeORM.",
                type: projectIsEsm ? "module" : "commonjs",
                devDependencies: {},
                dependencies: {},
                scripts: {},
            },
            undefined,
            3,
        )
    }

    /**
     * Gets contents of the new docker-compose.yml file.
     */
    protected static getDockerComposeTemplate(database: string): string {
        switch (database) {
            case "mysql":
                return `services:

  mysql:
    image: "mysql:9.2.0"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`
            case "mariadb":
                return `services:

  mariadb:
    image: "mariadb:11.7.2"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`
            case "postgres":
                return `services:

  postgres:
    image: "postgres:17.2"
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: "test"
      POSTGRES_PASSWORD: "test"
      POSTGRES_DB: "test"

`
            case "cockroachdb":
                return `services:

  cockroachdb:
    image: "cockroachdb/cockroach:v25.1.2"
    command: start --insecure
    ports:
      - "26257:26257"

`
            case "sqlite":
            case "better-sqlite3":
                return `services:
`
            case "oracle":
                throw new TypeORMError(
                    `You cannot initialize a project with docker for Oracle driver yet.`,
                ) // todo: implement for oracle as well

            case "mssql":
                return `services:

  mssql:
    image: "mcr.microsoft.com/mssql/server:2022-latest"
    ports:
      - "1433:1433"
    environment:
      SA_PASSWORD: "Admin12345"
      ACCEPT_EULA: "Y"
      MSSQL_PID: "Express"

`
            case "mongodb":
                return `services:

  mongodb:
    image: "mongo:8"
    container_name: "typeorm-mongodb"
    ports:
      - "27017:27017"

`
            case "spanner":
                return `services:

  spanner:
    image: gcr.io/cloud-spanner-emulator/emulator:1.5.30
    ports:
      - "9010:9010"
      - "9020:9020"

`
        }
        return ""
    }

    /**
     * Gets contents of the new readme.md file.
     */
    protected static getReadmeTemplate(options: { docker: boolean }): string {
        let template = `# Awesome Project Build with TypeORM

Steps to run this project:

1. Run \`npm i\` command
`

        if (options.docker) {
            template += `2. Run \`docker-compose up\` command
`
        } else {
            template += `2. Setup database settings inside \`data-source.ts\` file
`
        }

        template += `3. Run \`npm start\` command
`
        return template
    }

    /**
     * Appends to a given package.json template everything needed.
     */
    protected static appendPackageJson(
        packageJsonContents: string,
        database: string,
        express: boolean,
        projectIsEsm: boolean /*, docker: boolean*/,
    ): string {
        const packageJson = JSON.parse(packageJsonContents)

        if (!packageJson.devDependencies) packageJson.devDependencies = {}
        packageJson.devDependencies = {
            "@types/node": ourPackageJson.devDependencies["@types/node"],
            "ts-node": ourPackageJson.devDependencies["ts-node"],
            typescript: ourPackageJson.devDependencies.typescript,
            ...packageJson.devDependencies,
        }

        if (!packageJson.dependencies) packageJson.dependencies = {}
        packageJson.dependencies = {
            ...packageJson.dependencies,
            "reflect-metadata": ourPackageJson.dependencies["reflect-metadata"],
            typeorm: ourPackageJson.version,
        }

        switch (database) {
            case "mysql":
            case "mariadb":
                packageJson.dependencies["mysql2"] =
                    ourPackageJson.devDependencies.mysql2
                break
            case "postgres":
            case "cockroachdb":
                packageJson.dependencies["pg"] =
                    ourPackageJson.devDependencies.pg
                break
            case "sqlite":
                packageJson.dependencies["sqlite3"] =
                    ourPackageJson.devDependencies.sqlite3
                break
            case "better-sqlite3":
                packageJson.dependencies["better-sqlite3"] =
                    ourPackageJson.devDependencies["better-sqlite3"]
                break
            case "oracle":
                packageJson.dependencies["oracledb"] =
                    ourPackageJson.devDependencies.oracledb
                break
            case "mssql":
                packageJson.dependencies["mssql"] =
                    ourPackageJson.devDependencies.mssql
                break
            case "mongodb":
                packageJson.dependencies["mongodb"] =
                    ourPackageJson.devDependencies.mongodb
                break
            case "spanner":
                packageJson.dependencies["@google-cloud/spanner"] =
                    ourPackageJson.devDependencies["@google-cloud/spanner"]
                break
        }

        if (express) {
            packageJson.dependencies["express"] = "^4.21.2"
            packageJson.dependencies["body-parser"] = "^1.20.3"
        }

        if (!packageJson.scripts) packageJson.scripts = {}

        if (projectIsEsm)
            Object.assign(packageJson.scripts, {
                start: /*(docker ? "docker-compose up && " : "") + */ "node --loader ts-node/esm src/index.ts",
                typeorm: "typeorm-ts-node-esm",
            })
        else
            Object.assign(packageJson.scripts, {
                start: /*(docker ? "docker-compose up && " : "") + */ "ts-node src/index.ts",
                typeorm: "typeorm-ts-node-commonjs",
            })

        return JSON.stringify(packageJson, undefined, 3)
    }
}
