import ansi from "ansis"
import path from "path"
import process from "process"
import yargs from "yargs"
import { DataSource } from "../data-source/DataSource"
import { PlatformTools } from "../platform/PlatformTools"
import { QueryRunner } from "../query-runner/QueryRunner"
import { CommandUtils } from "./CommandUtils"

/**
 * Executes an SQL query on the given dataSource.
 */
export class QueryCommand implements yargs.CommandModule {
    command = "query [query]"
    describe =
        "Executes given SQL query on a default dataSource. Specify connection name to run query on a specific dataSource."

    builder(args: yargs.Argv) {
        return args
            .positional("query", {
                describe: "The SQL Query to run",
                type: "string",
            })
            .option("dataSource", {
                alias: "d",
                describe:
                    "Path to the file where your DataSource instance is defined.",
                demandOption: true,
            })
    }

    async handler(args: yargs.Arguments) {
        let queryRunner: QueryRunner | undefined = undefined
        let dataSource: DataSource | undefined = undefined
        try {
            dataSource = await CommandUtils.loadDataSource(
                path.resolve(process.cwd(), args.dataSource as string),
            )
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false,
            })
            await dataSource.initialize()

            // create a query runner and execute query using it
            queryRunner = dataSource.createQueryRunner()
            const query = args.query as string
            console.log(
                ansi.green("Running query: ") +
                    PlatformTools.highlightSql(query),
            )
            const queryResult = await queryRunner.query(query)

            if (typeof queryResult === "undefined") {
                console.log(
                    ansi.green(
                        "Query has been executed. No result was returned.",
                    ),
                )
            } else {
                console.log(ansi.green("Query has been executed. Result: "))
                console.dir(queryResult, {
                    breakLength: Infinity,
                    compact: false,
                    depth: null,
                })
            }

            await queryRunner.release()
            await dataSource.destroy()
        } catch (err) {
            PlatformTools.logCmdErr("Error during query execution:", err)

            if (queryRunner) await (queryRunner as QueryRunner).release()
            if (dataSource && dataSource.isInitialized)
                await dataSource.destroy()

            process.exit(1)
        }
    }
}
