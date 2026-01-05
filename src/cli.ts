#!/usr/bin/env node
import "reflect-metadata"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { CacheClearCommand } from "./commands/CacheClearCommand"
import { EntityCreateCommand } from "./commands/EntityCreateCommand"
import { InitCommand } from "./commands/InitCommand"
import { MigrationCreateCommand } from "./commands/MigrationCreateCommand"
import { MigrationGenerateCommand } from "./commands/MigrationGenerateCommand"
import { MigrationRevertCommand } from "./commands/MigrationRevertCommand"
import { MigrationRunCommand } from "./commands/MigrationRunCommand"
import { MigrationShowCommand } from "./commands/MigrationShowCommand"
import { QueryCommand } from "./commands/QueryCommand"
import { SchemaDropCommand } from "./commands/SchemaDropCommand"
import { SchemaLogCommand } from "./commands/SchemaLogCommand"
import { SchemaSyncCommand } from "./commands/SchemaSyncCommand"
import { SubscriberCreateCommand } from "./commands/SubscriberCreateCommand"
import { VersionCommand } from "./commands/VersionCommand"

// eslint-disable-next-line @typescript-eslint/no-floating-promises
yargs(hideBin(process.argv))
    .usage("Usage: $0 <command> [options]")
    .command(new CacheClearCommand())
    .command(new EntityCreateCommand())
    .command(new InitCommand())
    .command(new MigrationCreateCommand())
    .command(new MigrationGenerateCommand())
    .command(new MigrationRevertCommand())
    .command(new MigrationRunCommand())
    .command(new MigrationShowCommand())
    .command(new QueryCommand())
    .command(new SchemaDropCommand())
    .command(new SchemaLogCommand())
    .command(new SchemaSyncCommand())
    .command(new SubscriberCreateCommand())
    .command(new VersionCommand())
    .recommendCommands()
    .demandCommand(1)
    .strict()
    .alias("v", "version")
    .help("h")
    .alias("h", "help")
    .parse()
