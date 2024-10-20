import { DataSource } from "../../data-source"
import { ExpoLegacyDriver } from "./legacy/ExpoLegacyDriver"

export class ExpoDriverFactory {
    create(connection: DataSource): ExpoLegacyDriver {
        return new ExpoLegacyDriver(connection)
    }
}
