import * as path from "path"
import { DataSource } from "../data-source"

export class GenerateMigrationPathUtils {
    static getMigrationsDir(dataSource: DataSource): string {
        const migrations = dataSource.options.migrations

        if (Array.isArray(migrations)) {
            const migrationPath = migrations.find(
                (migration) => typeof migration === "string",
            )
            if (migrationPath) {
                return path.dirname(migrationPath as string)
            }
        }

        return ""
    }
}
