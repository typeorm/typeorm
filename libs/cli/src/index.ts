#!/usr/bin/env node
import "reflect-metadata";
import * as yargs from "yargs";
import { SchemaSyncCommand } from "./lib/commands/SchemaSyncCommand";
import { SchemaDropCommand } from "./lib/commands/SchemaDropCommand";
import { QueryCommand } from "./lib/commands/QueryCommand";
import { EntityCreateCommand } from "./lib/commands/EntityCreateCommand";
import { MigrationCreateCommand } from "./lib/commands/MigrationCreateCommand";
import { MigrationRunCommand } from "./lib/commands/MigrationRunCommand";
import { MigrationRevertCommand } from "./lib/commands/MigrationRevertCommand";
import { MigrationShowCommand } from "./lib/commands/MigrationShowCommand";
import { SubscriberCreateCommand } from "./lib/commands/SubscriberCreateCommand";
import { SchemaLogCommand } from "./lib/commands/SchemaLogCommand";
import { MigrationGenerateCommand } from "./lib/commands/MigrationGenerateCommand";
import { VersionCommand } from "./lib/commands/VersionCommand";
import { InitCommand } from "./lib/commands/InitCommand";
import { CacheClearCommand } from "./lib/commands/CacheClearCommand";

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
