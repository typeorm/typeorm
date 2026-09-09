import "reflect-metadata"
import { expect } from "chai"
import { ConnectionMetadataBuilder } from "../../../../src/connection/ConnectionMetadataBuilder"
import { DataSource } from "../../../../src/data-source/DataSource"
import type { DataSourceOptions } from "../../../../src/data-source/DataSourceOptions"
import { EntityMetadataValidator } from "../../../../src/metadata-builder/EntityMetadataValidator"
import { Item } from "./entity/Item"

describe("entity-metadata-validator > column length", () => {
    // dummy connection options, connection won't be established anyway
    const optionsFor = (type: string) =>
        ({
            type,
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            region: "us-east-1",
            secretArn:
                "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
            resourceArn: "arn:aws:rds:us-east-1:123456789012:cluster:test",
            entities: [Item],
        }) as DataSourceOptions

    const validate = async (type: string) => {
        const connection = new DataSource(optionsFor(type))
        const entityMetadatas = await new ConnectionMetadataBuilder(
            connection,
        ).buildEntityMetadatas([Item])
        const validator = new EntityMetadataValidator()
        return () => validator.validateMany(entityMetadatas, connection.driver)
    }

    // The set of types that accept a length differs per driver, so a column
    // carrying one the driver has no use for is ignored rather than rejected.
    // Rejecting made such a column undefinable for a codebase targeting more
    // than one driver.
    for (const type of [
        "postgres",
        "aurora-postgres",
        "cockroachdb",
        "mysql",
        "mariadb",
        "aurora-mysql",
        "oracle",
        "mssql",
        "sap",
        "spanner",
        "better-sqlite3",
    ]) {
        it(`should not throw for lengths carried by types that accept none on ${type}`, async () => {
            expect(await validate(type)).not.to.throw()
        })
    }
})
