"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCommand = void 0;
const tslib_1 = require("tslib");
const CommandUtils_1 = require("./CommandUtils");
const path = tslib_1.__importStar(require("path"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const child_process_1 = require("child_process");
/**
 * Generates a new project with TypeORM.
 */
class InitCommand {
    constructor() {
        this.command = "init";
        this.describe = "Generates initial TypeORM project structure. " +
            "If name specified then creates files inside directory called as name. " +
            "If its not specified then creates files inside current directory.";
    }
    builder(args) {
        return args
            .option("c", {
            alias: "connection",
            default: "default",
            describe: "Name of the connection on which to run a query"
        })
            .option("n", {
            alias: "name",
            describe: "Name of the project directory."
        })
            .option("db", {
            alias: "database",
            describe: "Database type you'll use in your project."
        })
            .option("express", {
            describe: "Indicates if express should be included in the project."
        })
            .option("docker", {
            describe: "Set to true if docker-compose must be generated as well. False by default."
        })
            .option("pm", {
            alias: "manager",
            choices: ["npm", "yarn"],
            default: "npm",
            describe: "Install packages, expected values are npm or yarn."
        });
    }
    handler(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const database = args.database || "mysql";
                const isExpress = args.express !== undefined ? true : false;
                const isDocker = args.docker !== undefined ? true : false;
                const basePath = process.cwd() + (args.name ? ("/" + args.name) : "");
                const projectName = args.name ? path.basename(args.name) : undefined;
                const installNpm = args.pm === "yarn" ? false : true;
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/package.json", InitCommand.getPackageJsonTemplate(projectName), false);
                if (isDocker)
                    yield CommandUtils_1.CommandUtils.createFile(basePath + "/docker-compose.yml", InitCommand.getDockerComposeTemplate(database), false);
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/.gitignore", InitCommand.getGitIgnoreFile());
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/README.md", InitCommand.getReadmeTemplate({ docker: isDocker }), false);
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/tsconfig.json", InitCommand.getTsConfigTemplate());
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/ormconfig.json", InitCommand.getOrmConfigTemplate(database));
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/src/entity/User.ts", InitCommand.getUserEntityTemplate(database));
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/src/index.ts", InitCommand.getAppIndexTemplate(isExpress));
                yield CommandUtils_1.CommandUtils.createDirectories(basePath + "/src/migration");
                // generate extra files for express application
                if (isExpress) {
                    yield CommandUtils_1.CommandUtils.createFile(basePath + "/src/routes.ts", InitCommand.getRoutesTemplate());
                    yield CommandUtils_1.CommandUtils.createFile(basePath + "/src/controller/UserController.ts", InitCommand.getControllerTemplate());
                }
                const packageJsonContents = yield CommandUtils_1.CommandUtils.readFile(basePath + "/package.json");
                yield CommandUtils_1.CommandUtils.createFile(basePath + "/package.json", InitCommand.appendPackageJson(packageJsonContents, database, isExpress));
                if (args.name) {
                    console.log(chalk_1.default.green(`Project created inside ${chalk_1.default.blue(basePath)} directory.`));
                }
                else {
                    console.log(chalk_1.default.green(`Project created inside current directory.`));
                }
                if (args.pm && installNpm) {
                    yield InitCommand.executeCommand("npm install");
                }
                else {
                    yield InitCommand.executeCommand("yarn install");
                }
            }
            catch (err) {
                console.log(chalk_1.default.black.bgRed("Error during project initialization:"));
                console.error(err);
                process.exit(1);
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    static executeCommand(command) {
        return new Promise((ok, fail) => {
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (stdout)
                    return ok(stdout);
                if (stderr)
                    return fail(stderr);
                if (error)
                    return fail(error);
                ok("");
            });
        });
    }
    /**
     * Gets contents of the ormconfig file.
     */
    static getOrmConfigTemplate(database) {
        const options = {};
        switch (database) {
            case "mysql":
                Object.assign(options, {
                    type: "mysql",
                    host: "localhost",
                    port: 3306,
                    username: "test",
                    password: "test",
                    database: "test",
                });
                break;
            case "mariadb":
                Object.assign(options, {
                    type: "mariadb",
                    host: "localhost",
                    port: 3306,
                    username: "test",
                    password: "test",
                    database: "test",
                });
                break;
            case "sqlite":
                Object.assign(options, {
                    type: "sqlite",
                    "database": "database.sqlite",
                });
                break;
            case "better-sqlite3":
                Object.assign(options, {
                    type: "better-sqlite3",
                    "database": "database.sqlite",
                });
                break;
            case "postgres":
                Object.assign(options, {
                    "type": "postgres",
                    "host": "localhost",
                    "port": 5432,
                    "username": "test",
                    "password": "test",
                    "database": "test",
                });
                break;
            case "cockroachdb":
                Object.assign(options, {
                    "type": "cockroachdb",
                    "host": "localhost",
                    "port": 26257,
                    "username": "root",
                    "password": "",
                    "database": "defaultdb",
                });
                break;
            case "mssql":
                Object.assign(options, {
                    "type": "mssql",
                    "host": "localhost",
                    "username": "sa",
                    "password": "Admin12345",
                    "database": "tempdb",
                });
                break;
            case "oracle":
                Object.assign(options, {
                    "type": "oracle",
                    "host": "localhost",
                    "username": "system",
                    "password": "oracle",
                    "port": 1521,
                    "sid": "xe.oracle.docker",
                });
                break;
            case "mongodb":
                Object.assign(options, {
                    "type": "mongodb",
                    "database": "test",
                });
                break;
        }
        Object.assign(options, {
            synchronize: true,
            logging: false,
            entities: [
                "src/entity/**/*.ts"
            ],
            migrations: [
                "src/migration/**/*.ts"
            ],
            subscribers: [
                "src/subscriber/**/*.ts"
            ],
            cli: {
                entitiesDir: "src/entity",
                migrationsDir: "src/migration",
                subscribersDir: "src/subscriber"
            }
        });
        return JSON.stringify(options, undefined, 3);
    }
    /**
     * Gets contents of the ormconfig file.
     */
    static getTsConfigTemplate() {
        return JSON.stringify({
            compilerOptions: {
                lib: ["es5", "es6"],
                target: "es5",
                module: "commonjs",
                moduleResolution: "node",
                outDir: "./build",
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                sourceMap: true
            }
        }, undefined, 3);
    }
    /**
     * Gets contents of the .gitignore file.
     */
    static getGitIgnoreFile() {
        return `.idea/
.vscode/
node_modules/
build/
tmp/
temp/`;
    }
    /**
     * Gets contents of the user entity.
     */
    static getUserEntityTemplate(database) {
        return `import {Entity, ${database === "mongodb" ? "ObjectIdColumn, ObjectID" : "PrimaryGeneratedColumn"}, Column} from "typeorm";

@Entity()
export class User {

    ${database === "mongodb" ? "@ObjectIdColumn()" : "@PrimaryGeneratedColumn()"}
    id: ${database === "mongodb" ? "ObjectID" : "number"};

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
`;
    }
    /**
     * Gets contents of the route file (used when express is enabled).
     */
    static getRoutesTemplate() {
        return `import {UserController} from "./controller/UserController";

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
}];`;
    }
    /**
     * Gets contents of the user controller file (used when express is enabled).
     */
    static getControllerTemplate() {
        return `import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {User} from "../entity/User";

export class UserController {

    private userRepository = getRepository(User);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.find();
    }

    async one(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.findOne(request.params.id);
    }

    async save(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.save(request.body);
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        let userToRemove = await this.userRepository.findOne(request.params.id);
        await this.userRepository.remove(userToRemove);
    }

}`;
    }
    /**
     * Gets contents of the main (index) application file.
     */
    static getAppIndexTemplate(express) {
        if (express) {
            return `import "reflect-metadata";
import {createConnection} from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import {Routes} from "./routes";
import {User} from "./entity/User";

createConnection().then(async connection => {

    // create express app
    const app = express();
    app.use(bodyParser.json());

    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
    });

    // setup express app here
    // ...

    // start express server
    app.listen(3000);

    // insert new users for test
    await connection.manager.save(connection.manager.create(User, {
        firstName: "Timber",
        lastName: "Saw",
        age: 27
    }));
    await connection.manager.save(connection.manager.create(User, {
        firstName: "Phantom",
        lastName: "Assassin",
        age: 24
    }));

    console.log("Express server has started on port 3000. Open http://localhost:3000/users to see results");

}).catch(error => console.log(error));
`;
        }
        else {
            return `import "reflect-metadata";
import {createConnection} from "typeorm";
import {User} from "./entity/User";

createConnection().then(async connection => {

    console.log("Inserting a new user into the database...");
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    user.age = 25;
    await connection.manager.save(user);
    console.log("Saved a new user with id: " + user.id);

    console.log("Loading users from the database...");
    const users = await connection.manager.find(User);
    console.log("Loaded users: ", users);

    console.log("Here you can setup and run express/koa/any other framework.");

}).catch(error => console.log(error));
`;
        }
    }
    /**
     * Gets contents of the new package.json file.
     */
    static getPackageJsonTemplate(projectName) {
        return JSON.stringify({
            name: projectName || "new-typeorm-project",
            version: "0.0.1",
            description: "Awesome project developed with TypeORM.",
            devDependencies: {},
            dependencies: {},
            scripts: {}
        }, undefined, 3);
    }
    /**
     * Gets contents of the new docker-compose.yml file.
     */
    static getDockerComposeTemplate(database) {
        switch (database) {
            case "mysql":
                return `version: '3'
services:

  mysql:
    image: "mysql:5.7.10"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`;
            case "mariadb":
                return `version: '3'
services:

  mariadb:
    image: "mariadb:10.1.16"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`;
            case "postgres":
                return `version: '3'
services:

  postgres:
    image: "postgres:9.6.1"
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: "test"
      POSTGRES_PASSWORD: "test"
      POSTGRES_DB: "test"

`;
            case "cockroachdb":
                return `version: '3'
services:

  cockroachdb:
    image: "cockroachdb/cockroach:v2.1.4"
    command: start --insecure
    ports:
      - "26257:26257"

`;
            case "sqlite":
            case "better-sqlite3":
                return `version: '3'
services:
`;
            case "oracle":
                throw new Error(`You cannot initialize a project with docker for Oracle driver yet.`); // todo: implement for oracle as well
            case "mssql":
                return `version: '3'
services:

  mssql:
    image: "microsoft/mssql-server-linux:rc2"
    ports:
      - "1433:1433"
    environment:
      SA_PASSWORD: "Admin12345"
      ACCEPT_EULA: "Y"

`;
            case "mongodb":
                return `version: '3'
services:

  mongodb:
    image: "mongo:4.0.6"
    container_name: "typeorm-mongodb"
    ports:
      - "27017:27017"

`;
        }
        return "";
    }
    /**
     * Gets contents of the new readme.md file.
     */
    static getReadmeTemplate(options) {
        let template = `# Awesome Project Build with TypeORM

Steps to run this project:

1. Run \`npm i\` command
`;
        if (options.docker) {
            template += `2. Run \`docker-compose up\` command
`;
        }
        else {
            template += `2. Setup database settings inside \`ormconfig.json\` file
`;
        }
        template += `3. Run \`npm start\` command
`;
        return template;
    }
    /**
     * Appends to a given package.json template everything needed.
     */
    static appendPackageJson(packageJsonContents, database, express /*, docker: boolean*/) {
        const packageJson = JSON.parse(packageJsonContents);
        if (!packageJson.devDependencies)
            packageJson.devDependencies = {};
        Object.assign(packageJson.devDependencies, {
            "ts-node": "3.3.0",
            "@types/node": "^8.0.29",
            "typescript": "3.3.3333"
        });
        if (!packageJson.dependencies)
            packageJson.dependencies = {};
        Object.assign(packageJson.dependencies, {
            "typeorm": require("../package.json").version,
            "reflect-metadata": "^0.1.10"
        });
        switch (database) {
            case "mysql":
            case "mariadb":
                packageJson.dependencies["mysql"] = "^2.14.1";
                break;
            case "postgres":
            case "cockroachdb":
                packageJson.dependencies["pg"] = "^8.4.0";
                break;
            case "sqlite":
                packageJson.dependencies["sqlite3"] = "^4.0.3";
                break;
            case "better-sqlite3":
                packageJson.dependencies["better-sqlite3"] = "^7.0.0";
                break;
            case "oracle":
                packageJson.dependencies["oracledb"] = "^1.13.1";
                break;
            case "mssql":
                packageJson.dependencies["mssql"] = "^4.0.4";
                break;
            case "mongodb":
                packageJson.dependencies["mongodb"] = "^3.0.8";
                break;
        }
        if (express) {
            packageJson.dependencies["express"] = "^4.15.4";
            packageJson.dependencies["body-parser"] = "^1.18.1";
        }
        if (!packageJson.scripts)
            packageJson.scripts = {};
        Object.assign(packageJson.scripts, {
            start: /*(docker ? "docker-compose up && " : "") + */ "ts-node src/index.ts"
        });
        return JSON.stringify(packageJson, undefined, 3);
    }
}
exports.InitCommand = InitCommand;

//# sourceMappingURL=InitCommand.js.map
