#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var yargs_1 = tslib_1.__importDefault(require("yargs"));
var SchemaSyncCommand_1 = require("./commands/SchemaSyncCommand");
var SchemaDropCommand_1 = require("./commands/SchemaDropCommand");
var QueryCommand_1 = require("./commands/QueryCommand");
var EntityCreateCommand_1 = require("./commands/EntityCreateCommand");
var MigrationCreateCommand_1 = require("./commands/MigrationCreateCommand");
var MigrationRunCommand_1 = require("./commands/MigrationRunCommand");
var MigrationRevertCommand_1 = require("./commands/MigrationRevertCommand");
var MigrationShowCommand_1 = require("./commands/MigrationShowCommand");
var SubscriberCreateCommand_1 = require("./commands/SubscriberCreateCommand");
var SchemaLogCommand_1 = require("./commands/SchemaLogCommand");
var MigrationGenerateCommand_1 = require("./commands/MigrationGenerateCommand");
var VersionCommand_1 = require("./commands/VersionCommand");
var InitCommand_1 = require("./commands/InitCommand");
var CacheClearCommand_1 = require("./commands/CacheClearCommand");
yargs_1.default
    .usage("Usage: $0 <command> [options]")
    .command(new SchemaSyncCommand_1.SchemaSyncCommand())
    .command(new SchemaLogCommand_1.SchemaLogCommand())
    .command(new SchemaDropCommand_1.SchemaDropCommand())
    .command(new QueryCommand_1.QueryCommand())
    .command(new EntityCreateCommand_1.EntityCreateCommand())
    .command(new SubscriberCreateCommand_1.SubscriberCreateCommand())
    .command(new MigrationCreateCommand_1.MigrationCreateCommand())
    .command(new MigrationGenerateCommand_1.MigrationGenerateCommand())
    .command(new MigrationRunCommand_1.MigrationRunCommand())
    .command(new MigrationShowCommand_1.MigrationShowCommand())
    .command(new MigrationRevertCommand_1.MigrationRevertCommand())
    .command(new VersionCommand_1.VersionCommand())
    .command(new CacheClearCommand_1.CacheClearCommand())
    .command(new InitCommand_1.InitCommand())
    .recommendCommands()
    .demandCommand(1)
    .strict()
    .alias("v", "version")
    .help("h")
    .alias("h", "help")
    .argv;
require("yargonaut")
    .style("blue")
    .style("yellow", "required")
    .helpStyle("green")
    .errorsStyle("red");

//# sourceMappingURL=cli.js.map
