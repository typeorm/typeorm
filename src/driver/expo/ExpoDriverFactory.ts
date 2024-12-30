import { DataSource } from "../../data-source"
import { ExpoDriver } from "./ExpoDriver"
import { ExpoLegacyDriver } from "./legacy/ExpoLegacyDriver"

export class ExpoDriverFactory {
    connection: DataSource

    constructor(connection: DataSource) {
        this.connection = connection
    }

    create(): ExpoDriver | ExpoLegacyDriver {
        if (this.isLegacyDriver) {
            return new ExpoLegacyDriver(this.connection)
        }

        return new ExpoDriver(this.connection)
    }

    private get isLegacyDriver(): boolean {
        return !("openDatabaseAsync" in this.connection.options.driver)
    }
}
