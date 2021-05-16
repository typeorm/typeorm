#!/usr/bin/env node
import "reflect-metadata";
import yargs from "yargs";
import {SchemaSyncCommand} from "./commands/SchemaSyncCommand";
import {SchemaDropCommand} from "./commands/SchemaDropCommand";
import {QueryCommand} from "./commands/QueryCommand";
import {EntityCreateCommand} from "./commands/EntityCreateCommand";
import {MigrationCreateCommand} from "./commands/MigrationCreateCommand";
import {MigrationRunCommand} from "./commands/MigrationRunCommand";
import {MigrationRevertCommand} from "./commands/MigrationRevertCommand";
import {MigrationShowCommand} from "./commands/MigrationShowCommand";
import {SubscriberCreateCommand} from "./commands/SubscriberCreateCommand";
import {SchemaLogCommand} from "./commands/SchemaLogCommand";
import {MigrationGenerateCommand} from "./commands/MigrationGenerateCommand";
import {VersionCommand} from "./commands/VersionCommand";
import {InitCommand} from "./commands/InitCommand";
import {CacheClearCommand} from "./commands/CacheClearCommand";

yargs
    .usage("Usage: $0 <command> [options]")
    .command(new SchemaSyncCommand())
    .command(new SchemaLogCommand())
    .command(new SchemaDropCommand())
    .command(new QueryCommand())
    .command(new EntityCreateCommand())
    .command(new SubscriberCreateCommand())
    .command(new MigrationCreateCommand())
    .command(new MigrationGenerateCommand())
    .command(new MigrationRunCommand())
    .command(new MigrationShowCommand())
    .command(new MigrationRevertCommand())
    .command(new VersionCommand())
    .command(new CacheClearCommand())
    .command(new InitCommand())
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
