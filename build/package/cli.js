#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("reflect-metadata");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const SchemaSyncCommand_1 = require("./commands/SchemaSyncCommand");
const SchemaDropCommand_1 = require("./commands/SchemaDropCommand");
const QueryCommand_1 = require("./commands/QueryCommand");
const EntityCreateCommand_1 = require("./commands/EntityCreateCommand");
const MigrationCreateCommand_1 = require("./commands/MigrationCreateCommand");
const MigrationRunCommand_1 = require("./commands/MigrationRunCommand");
const MigrationRevertCommand_1 = require("./commands/MigrationRevertCommand");
const MigrationShowCommand_1 = require("./commands/MigrationShowCommand");
const SubscriberCreateCommand_1 = require("./commands/SubscriberCreateCommand");
const SchemaLogCommand_1 = require("./commands/SchemaLogCommand");
const MigrationGenerateCommand_1 = require("./commands/MigrationGenerateCommand");
const VersionCommand_1 = require("./commands/VersionCommand");
const InitCommand_1 = require("./commands/InitCommand");
const CacheClearCommand_1 = require("./commands/CacheClearCommand");
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
