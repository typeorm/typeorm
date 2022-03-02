import { Connection } from "..";
import { SchemaBuilder } from "./SchemaBuilder";
import { SqlInMemory } from "../driver/SqlInMemory";
import { DynamoDriver } from "../driver/dynamo/DynamoDriver";
import { PlatformTools } from "../platform/PlatformTools";
import {
    buildAttributeDefinitions,
    buildGlobalSecondaryIndexes
} from "../driver/dynamo/helpers/GlobalSecondaryIndexHelper";

/**
 * Creates complete tables schemas in the database based on the entity metadatas.
 *
 * Steps how schema is being built:
 * 1. load list of all tables with complete column and keys information from the db
 * 2. drop all (old) foreign keys that exist in the table, but does not exist in the metadata
 * 3. create new tables that does not exist in the db, but exist in the metadata
 * 4. drop all columns exist (left old) in the db table, but does not exist in the metadata
 * 5. add columns from metadata which does not exist in the table
 * 6. update all exist columns which metadata has changed
 * 7. update primary keys - update old and create new primary key from changed columns
 * 8. create foreign keys which does not exist in the table yet
 * 9. create indices which are missing in db yet, and drops indices which exist in the db, but does not exist in the metadata anymore
 */
export class DynamoSchemaBuilder implements SchemaBuilder {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor (protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    async build (): Promise<void> {
        const AWS = PlatformTools.load("aws-sdk");
        const db = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
        const driver: DynamoDriver = this.connection.driver as DynamoDriver;
        const metadatas = this.connection.entityMetadatas;
        for (let i = 0; i < metadatas.length; i += 1) {
            const metadata = metadatas[i];
            const keySchema: any[] = [];
            for (let i = 0; i < metadata.primaryColumns.length; i += 1) {
                const primaryColumn = metadata.primaryColumns[i];
                keySchema.push({
                    AttributeName: primaryColumn.propertyName,
                    KeyType: "HASH"
                });
            }
            const schema = {
                AttributeDefinitions: buildAttributeDefinitions(metadata, driver),
                BillingMode: "PAY_PER_REQUEST",
                TableName: driver.buildTableName(metadata.tableName, metadata.schema, metadata.database),
                KeySchema: keySchema,
                GlobalSecondaryIndexes: buildGlobalSecondaryIndexes(metadata)
            };
            try {
                await db.createTable(schema).promise();
            } catch (error) {
                const _error: any = error;
                if (_error && _error.code && _error.code === "ResourceInUseException") {
                    PlatformTools.logInfo("table already exists: ", metadata.tableName);
                } else {
                    PlatformTools.logError("error creating table: ", error);
                }
            }
        }
    }

    /**
     * Returns query to be executed by schema builder.
     */
    log (): Promise<SqlInMemory> {
        return Promise.resolve(new SqlInMemory());
    }
}
