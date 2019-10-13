"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CommandUtils_1 = require("./CommandUtils");
var path = require("path");
var chalk = require("chalk");
/**
 * Generates a new project with TypeORM.
 */
var InitCommand = /** @class */ (function () {
    function InitCommand() {
        this.command = "init";
        this.describe = "Generates initial TypeORM project structure. " +
            "If name specified then creates files inside directory called as name. " +
            "If its not specified then creates files inside current directory.";
    }
    InitCommand.prototype.builder = function (args) {
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
        });
    };
    InitCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var database, isExpress, isDocker, basePath, projectName, packageJsonContents, err_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 16, , 17]);
                        database = args.database || "mysql";
                        isExpress = args.express !== undefined ? true : false;
                        isDocker = args.docker !== undefined ? true : false;
                        basePath = process.cwd() + (args.name ? ("/" + args.name) : "");
                        projectName = args.name ? path.basename(args.name) : undefined;
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/package.json", InitCommand.getPackageJsonTemplate(projectName), false)];
                    case 1:
                        _a.sent();
                        if (!isDocker) return [3 /*break*/, 3];
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/docker-compose.yml", InitCommand.getDockerComposeTemplate(database), false)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/.gitignore", InitCommand.getGitIgnoreFile())];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/README.md", InitCommand.getReadmeTemplate({ docker: isDocker }), false)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/tsconfig.json", InitCommand.getTsConfigTemplate())];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/ormconfig.json", InitCommand.getOrmConfigTemplate(database))];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/src/entity/User.ts", InitCommand.getUserEntityTemplate(database))];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/src/index.ts", InitCommand.getAppIndexTemplate(isExpress))];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createDirectories(basePath + "/src/migration")];
                    case 10:
                        _a.sent();
                        if (!isExpress) return [3 /*break*/, 13];
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/src/routes.ts", InitCommand.getRoutesTemplate())];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/src/controller/UserController.ts", InitCommand.getControllerTemplate())];
                    case 12:
                        _a.sent();
                        _a.label = 13;
                    case 13: return [4 /*yield*/, CommandUtils_1.CommandUtils.readFile(basePath + "/package.json")];
                    case 14:
                        packageJsonContents = _a.sent();
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(basePath + "/package.json", InitCommand.appendPackageJson(packageJsonContents, database, isExpress))];
                    case 15:
                        _a.sent();
                        if (args.name) {
                            console.log(chalk.green("Project created inside " + chalk.blue(basePath) + " directory."));
                        }
                        else {
                            console.log(chalk.green("Project created inside current directory."));
                        }
                        return [3 /*break*/, 17];
                    case 16:
                        err_1 = _a.sent();
                        console.log(chalk.black.bgRed("Error during project initialization:"));
                        console.error(err_1);
                        process.exit(1);
                        return [3 /*break*/, 17];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Gets contents of the ormconfig file.
     */
    InitCommand.getOrmConfigTemplate = function (database) {
        var options = {};
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
    };
    /**
     * Gets contents of the ormconfig file.
     */
    InitCommand.getTsConfigTemplate = function () {
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
    };
    /**
     * Gets contents of the .gitignore file.
     */
    InitCommand.getGitIgnoreFile = function () {
        return ".idea/\n.vscode/\nnode_modules/\nbuild/\ntmp/\ntemp/";
    };
    /**
     * Gets contents of the user entity.
     */
    InitCommand.getUserEntityTemplate = function (database) {
        return "import {Entity, " + (database === "mongodb" ? "ObjectIdColumn, ObjectID" : "PrimaryGeneratedColumn") + ", Column} from \"typeorm\";\n\n@Entity()\nexport class User {\n\n    " + (database === "mongodb" ? "@ObjectIdColumn()" : "@PrimaryGeneratedColumn()") + "\n    id: " + (database === "mongodb" ? "ObjectID" : "number") + ";\n\n    @Column()\n    firstName: string;\n\n    @Column()\n    lastName: string;\n\n    @Column()\n    age: number;\n\n}\n";
    };
    /**
     * Gets contents of the route file (used when express is enabled).
     */
    InitCommand.getRoutesTemplate = function () {
        return "import {UserController} from \"./controller/UserController\";\n\nexport const Routes = [{\n    method: \"get\",\n    route: \"/users\",\n    controller: UserController,\n    action: \"all\"\n}, {\n    method: \"get\",\n    route: \"/users/:id\",\n    controller: UserController,\n    action: \"one\"\n}, {\n    method: \"post\",\n    route: \"/users\",\n    controller: UserController,\n    action: \"save\"\n}, {\n    method: \"delete\",\n    route: \"/users/:id\",\n    controller: UserController,\n    action: \"remove\"\n}];";
    };
    /**
     * Gets contents of the user controller file (used when express is enabled).
     */
    InitCommand.getControllerTemplate = function () {
        return "import {getRepository} from \"typeorm\";\nimport {NextFunction, Request, Response} from \"express\";\nimport {User} from \"../entity/User\";\n\nexport class UserController {\n\n    private userRepository = getRepository(User);\n\n    async all(request: Request, response: Response, next: NextFunction) {\n        return this.userRepository.find();\n    }\n\n    async one(request: Request, response: Response, next: NextFunction) {\n        return this.userRepository.findOne(request.params.id);\n    }\n\n    async save(request: Request, response: Response, next: NextFunction) {\n        return this.userRepository.save(request.body);\n    }\n\n    async remove(request: Request, response: Response, next: NextFunction) {\n        let userToRemove = await this.userRepository.findOne(request.params.id);\n        await this.userRepository.remove(userToRemove);\n    }\n\n}";
    };
    /**
     * Gets contents of the main (index) application file.
     */
    InitCommand.getAppIndexTemplate = function (express) {
        if (express) {
            return "import \"reflect-metadata\";\nimport {createConnection} from \"typeorm\";\nimport * as express from \"express\";\nimport * as bodyParser from \"body-parser\";\nimport {Request, Response} from \"express\";\nimport {Routes} from \"./routes\";\nimport {User} from \"./entity/User\";\n\ncreateConnection().then(async connection => {\n\n    // create express app\n    const app = express();\n    app.use(bodyParser.json());\n\n    // register express routes from defined application routes\n    Routes.forEach(route => {\n        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {\n            const result = (new (route.controller as any))[route.action](req, res, next);\n            if (result instanceof Promise) {\n                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);\n\n            } else if (result !== null && result !== undefined) {\n                res.json(result);\n            }\n        });\n    });\n\n    // setup express app here\n    // ...\n\n    // start express server\n    app.listen(3000);\n\n    // insert new users for test\n    await connection.manager.save(connection.manager.create(User, {\n        firstName: \"Timber\",\n        lastName: \"Saw\",\n        age: 27\n    }));\n    await connection.manager.save(connection.manager.create(User, {\n        firstName: \"Phantom\",\n        lastName: \"Assassin\",\n        age: 24\n    }));\n\n    console.log(\"Express server has started on port 3000. Open http://localhost:3000/users to see results\");\n\n}).catch(error => console.log(error));\n";
        }
        else {
            return "import \"reflect-metadata\";\nimport {createConnection} from \"typeorm\";\nimport {User} from \"./entity/User\";\n\ncreateConnection().then(async connection => {\n\n    console.log(\"Inserting a new user into the database...\");\n    const user = new User();\n    user.firstName = \"Timber\";\n    user.lastName = \"Saw\";\n    user.age = 25;\n    await connection.manager.save(user);\n    console.log(\"Saved a new user with id: \" + user.id);\n\n    console.log(\"Loading users from the database...\");\n    const users = await connection.manager.find(User);\n    console.log(\"Loaded users: \", users);\n\n    console.log(\"Here you can setup and run express/koa/any other framework.\");\n\n}).catch(error => console.log(error));\n";
        }
    };
    /**
     * Gets contents of the new package.json file.
     */
    InitCommand.getPackageJsonTemplate = function (projectName) {
        return JSON.stringify({
            name: projectName || "new-typeorm-project",
            version: "0.0.1",
            description: "Awesome project developed with TypeORM.",
            devDependencies: {},
            dependencies: {},
            scripts: {}
        }, undefined, 3);
    };
    /**
     * Gets contents of the new docker-compose.yml file.
     */
    InitCommand.getDockerComposeTemplate = function (database) {
        switch (database) {
            case "mysql":
                return "version: '3'\nservices:\n\n  mysql:\n    image: \"mysql:5.7.10\"\n    ports:\n      - \"3306:3306\"\n    environment:\n      MYSQL_ROOT_PASSWORD: \"admin\"\n      MYSQL_USER: \"test\"\n      MYSQL_PASSWORD: \"test\"\n      MYSQL_DATABASE: \"test\"\n\n";
            case "mariadb":
                return "version: '3'\nservices:\n\n  mariadb:\n    image: \"mariadb:10.1.16\"\n    ports:\n      - \"3306:3306\"\n    environment:\n      MYSQL_ROOT_PASSWORD: \"admin\"\n      MYSQL_USER: \"test\"\n      MYSQL_PASSWORD: \"test\"\n      MYSQL_DATABASE: \"test\"\n\n";
            case "postgres":
                return "version: '3'\nservices:\n\n  postgres:\n    image: \"postgres:9.6.1\"\n    ports:\n      - \"5432:5432\"\n    environment:\n      POSTGRES_USER: \"test\"\n      POSTGRES_PASSWORD: \"test\"\n      POSTGRES_DB: \"test\"\n\n";
            case "cockroachdb":
                return "version: '3'\nservices:\n\n  cockroachdb:\n    image: \"cockroachdb/cockroach:v2.1.4\"\n    command: start --insecure\n    ports:\n      - \"26257:26257\"\n\n";
            case "sqlite":
                return "version: '3'\nservices:\n";
            case "oracle":
                throw new Error("You cannot initialize a project with docker for Oracle driver yet."); // todo: implement for oracle as well
            case "mssql":
                return "version: '3'\nservices:\n\n  mssql:\n    image: \"microsoft/mssql-server-linux:rc2\"\n    ports:\n      - \"1433:1433\"\n    environment:\n      SA_PASSWORD: \"Admin12345\"\n      ACCEPT_EULA: \"Y\"\n\n";
            case "mongodb":
                return "version: '3'\nservices:\n\n  mongodb:\n    image: \"mongo:4.0.6\"\n    container_name: \"typeorm-mongodb\"\n    ports:\n      - \"27017:27017\"\n\n";
        }
        return "";
    };
    /**
     * Gets contents of the new readme.md file.
     */
    InitCommand.getReadmeTemplate = function (options) {
        var template = "# Awesome Project Build with TypeORM\n\nSteps to run this project:\n\n1. Run `npm i` command\n";
        if (options.docker) {
            template += "2. Run `docker-compose up` command\n";
        }
        else {
            template += "2. Setup database settings inside `ormconfig.json` file\n";
        }
        template += "3. Run `npm start` command\n";
        return template;
    };
    /**
     * Appends to a given package.json template everything needed.
     */
    InitCommand.appendPackageJson = function (packageJsonContents, database, express /*, docker: boolean*/) {
        var packageJson = JSON.parse(packageJsonContents);
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
                packageJson.dependencies["pg"] = "^7.3.0";
                break;
            case "sqlite":
                packageJson.dependencies["sqlite3"] = "^4.0.3";
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
    };
    return InitCommand;
}());
exports.InitCommand = InitCommand;
//# sourceMappingURL=InitCommand.js.map