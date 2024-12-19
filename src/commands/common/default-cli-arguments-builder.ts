import yargs from "yargs"

export class DefaultCliArgumentsBuilder {
    constructor(private readonly _builder: yargs.Argv) {}

    builder() {
        return this._builder
    }

    addDataSourceOption(extraOptions: yargs.Options = {}) {
        this.builder().option("dataSource", {
            alias: "d",
            describe:
                "Path to the file where your DataSource instance is defined.",
            demandOption: true,
            ...extraOptions,
        })

        return this
    }

    addMigrationsPathOption(extraOptions: yargs.Options = {}) {
        this.builder().option("migrationsPath", {
            type: "string",
            alias: "mp",
            describe: "Path to the directory where your migrations are stored",
            ...extraOptions,
        })

        return this
    }

    addTransactionOption(extraOptions: yargs.Options = {}) {
        this.builder().option("transaction", {
            alias: "t",
            default: "default",
            describe:
                "Indicates if transaction should be used or not for migration run. Enabled by default.",
            ...extraOptions,
        })

        return this
    }

    addFakeOption(extraOptions: yargs.Options = {}) {
        this.builder().option("fake", {
            alias: "f",
            type: "boolean",
            default: false,
            describe:
                "Fakes running the migrations if table schema has already been changed manually or externally " +
                "(e.g. through another project)",
            ...extraOptions,
        })

        return this
    }
}
