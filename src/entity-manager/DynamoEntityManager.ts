/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for DynamoDB driver which has some specifics in its EntityManager.
 */
import { Connection } from "../connection/Connection";
import { EntityManager } from "./EntityManager";
import { EntityTarget } from "../common/EntityTarget";
import {
    ObjectID,
} from "../driver/mongodb/typings";
import { ObjectLiteral } from "../common/ObjectLiteral";
import { FindOptionsUtils } from "../find-options/FindOptionsUtils";
import { FindOneOptions } from "../find-options/FindOneOptions";
import { DeepPartial } from "../common/DeepPartial";
import { QueryDeepPartialEntity } from "../query-builder/QueryPartialEntity";
import { DeleteResult } from "../query-builder/result/DeleteResult";
import {DynamoQueryRunner} from "../driver/dynamo/DynamoQueryRunner";
import {DynamoDriver} from "../driver/dynamo/DynamoDriver";
import {UpdateOptions} from "../driver/dynamo/models/UpdateOptions";
import {paramHelper} from "../driver/dynamo/helpers/ParamHelper";
import {DynamoClient} from "../driver/dynamo/DynamoClient";
import {indexedColumns} from "../driver/dynamo/helpers/GlobalSecondaryIndexHelper";
import {FindOptions} from "../driver/dynamo/models/FindOptions";
import {commonUtils} from "../driver/dynamo/utils/CommonUtils";
import {ScanOptions} from "../driver/dynamo/models/ScanOptions";
import {batchHelper} from "../driver/dynamo/helpers/BatchHelper";
import {BatchWriteItem} from "../driver/dynamo/models/BatchWriteItem";

// todo: we should look at the @PrimaryKey on the entity
const DEFAULT_KEY_MAPPER = (item: any) => {
    return {
        id: item.id
    };
};

export class DynamoEntityManager extends EntityManager {
    get dynamodbQueryRunner (): DynamoQueryRunner {
        return (this.connection.driver as DynamoDriver).queryRunner as DynamoQueryRunner;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor (connection: Connection) {
        super(connection);
    }

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    createDefaultKeyMapper<Entity> (target: EntityTarget<Entity>) {
        const metadata = this.connection.getMetadata(target);

        return (entity: ObjectLiteral) => {
            const keys: any = {};
            for (let i = 0; i < metadata.primaryColumns.length; i++) {
                const primaryColumn = metadata.primaryColumns[i];
                const propertyName = primaryColumn.propertyName;
                keys[propertyName] = entity[propertyName];
            }
            return keys;
        };
    }

    async update<Entity> (entityClassOrName: EntityTarget<Entity>, options: UpdateOptions) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        // TODO: needs to be smart enough to set the indexedColumns if any of the underlying columns are changed
        indexedColumns(metadata, entityClassOrName);
        const params = paramHelper.update(metadata.tablePath, options);
        return new DynamoClient().update(params);
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    async find<Entity> (entityClassOrName: EntityTarget<Entity>, options?: FindOptions | any): Promise<Entity[]> {
        if (options) {
            const dbClient = new DynamoClient();
            const metadata = this.connection.getMetadata(entityClassOrName);
            const params = paramHelper.find(metadata.tablePath, options, metadata.indices);
            const results = commonUtils.isEmpty(options.where) ? await dbClient.scan(params) : await dbClient.query(params);
            const items: any = results.Items || [];
            items.lastEvaluatedKey = results.LastEvaluatedKey;
            return items;
        }
        return [];
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    async findAll<Entity> (entityClassOrName: EntityTarget<Entity>, options: FindOptions): Promise<Entity[]> {
        delete options.limit;
        const dbClient = new DynamoClient();
        const metadata = this.connection.getMetadata(entityClassOrName);
        const params = paramHelper.find(metadata.tablePath, options, metadata.indices);
        let items: any[] = [];
        let results = await dbClient.query(params);
        items = items.concat(results.Items || []);
        while (results.LastEvaluatedKey) {
            params.ExclusiveStartKey = results.LastEvaluatedKey;
            results = await dbClient.query(params);
            items = items.concat(results.Items || []);
        }
        return items;
    }

    async scan<Entity> (entityClassOrName: EntityTarget<Entity>, options: ScanOptions) {
        const dbClient = new DynamoClient();
        const metadata = this.connection.getMetadata(entityClassOrName);
        const params: any = {
            TableName: metadata.tablePath
            // IndexName: findOptions.index,
            // KeyConditionExpression: FindOptions.toKeyConditionExpression(findOptions.where),
            // ExpressionAttributeValues: FindOptions.toExpressionAttributeValues(findOptions.where)
        };
        if (options.limit) {
            params.Limit = options.limit;
        }
        if (options.exclusiveStartKey) {
            params.ExclusiveStartKey = options.exclusiveStartKey;
        }
        const results: any = await dbClient.scan(params);
        const items = results.Items || [];
        items.LastEvaluatedKey = results.LastEvaluatedKey;
        return items;
    }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async findOne<Entity> (entityClassOrName: EntityTarget<Entity>,
        optionsOrConditions?: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOneOptions<Entity> | DeepPartial<Entity>,
        maybeOptions?: FindOneOptions<Entity>): Promise<Entity | undefined> {
        const dbClient = new DynamoClient();
        const metadata = this.connection.getMetadata(entityClassOrName);
        const id = typeof optionsOrConditions === "string" ? optionsOrConditions : undefined;
        const findOneOptionsOrConditions = (id ? maybeOptions : optionsOrConditions) as any;
        let options;
        if (FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
            options = new FindOptions();
            options.where = findOneOptionsOrConditions.where;
            options.limit = 1;
        } else {
            options = new FindOptions();
            options.where = { id };
            options.limit = 1;
        }
        const params = paramHelper.find(metadata.tablePath, options, metadata.indices);
        const results = await dbClient.query(params);
        const items: any = results.Items || [];
        return items.length > 0 ? items[0] : undefined;
    }

    /**
     * Put a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async put<Entity> (target: EntityTarget<Entity>, entity: DeepPartial<Entity> | DeepPartial<Entity>[]): Promise<void> {
        if (Array.isArray(entity)) {
            await this.putMany(target, entity);
        } else {
            await this.putOne(target, entity);
        }
    }

    async delete<Entity> (targetOrEntity: EntityTarget<Entity>, criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | any): Promise<DeleteResult> {
        if (Array.isArray(criteria)) {
            await this.deleteMany(targetOrEntity, criteria);
        } else {
            await this.deleteOne(targetOrEntity, criteria);
        }
        return {
            raw: {}
        };
    }

    async deleteAll <Entity> (target: EntityTarget<Entity>, options: FindOptions, keyMapper?: any) {
        let items = await this.scan(target, { limit: 500 });
        while (items.length > 0) {
            const itemIds = items.map(keyMapper || this.createDefaultKeyMapper(target));
            await this.deleteMany(target, itemIds);
            await this.deleteAll(target, keyMapper);
            items = await this.scan(target, { limit: 500 });
        }
    }

    deleteAllBy <Entity> (target: EntityTarget<Entity>, options: FindOptions, keyMapper?: any) {
        options.limit = options.limit || 500;
        return this.deleteQueryBatch(target, options, keyMapper);
    }

    async deleteQueryBatch <Entity> (target: EntityTarget<Entity>, options: FindOptions, keyMapper?: any) {
        const items: any[] = await this.find(target, options);
        if (items.length > 0) {
            const metadata = this.connection.getMetadata(target);
            keyMapper = keyMapper || DEFAULT_KEY_MAPPER;
            const keys: any[] = items.map(keyMapper);
            await this.deleteMany(metadata.tablePath, keys);
            await this.deleteQueryBatch(target, options, keyMapper);
        }
    }

    /**
     * Delete multiple documents on DynamoDB.
     */
    deleteMany<Entity> (entityClassOrName: EntityTarget<Entity>, keys: QueryDeepPartialEntity<Entity>[]): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.dynamodbQueryRunner.deleteMany(metadata.tablePath, keys);
    }

    /**
     * Delete a document on DynamoDB.
     */
    deleteOne<Entity> (entityClassOrName: EntityTarget<Entity>, key: ObjectLiteral): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.dynamodbQueryRunner.deleteOne(metadata.tablePath, key);
    }

    /**
     * Put an array of documents into DynamoDB.
     */
    putMany<Entity> (entityClassOrName: EntityTarget<Entity>, docs: ObjectLiteral[]): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        docs.forEach((doc: ObjectLiteral) => {
            indexedColumns(metadata, doc);
        });
        return this.dynamodbQueryRunner.putMany(metadata.tablePath, docs);
    }

    /**
     * Put a single document into DynamoDB.
     */
    putOne<Entity> (entityClassOrName: EntityTarget<Entity>, doc: ObjectLiteral): Promise<ObjectLiteral> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        indexedColumns(metadata, doc);
        return this.dynamodbQueryRunner.putOne(metadata.tablePath, doc);
    }

    /**
     * Read from DynamoDB in batches.
     */
    async batchRead<Entity> (entityClassOrName: EntityTarget<Entity>, keys: ObjectLiteral[]) {
        const dbClient = new DynamoClient();
        const metadata = this.connection.getMetadata(entityClassOrName);
        const batches = batchHelper.batch(keys, 100);
        let items: any[] = [];
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const requestItems: any = {};
            requestItems[metadata.tablePath] = {
                Keys: batch
            };
            const response = await dbClient.batchGet({
                RequestItems: requestItems
            });
            if (response.Responses !== undefined) {
                items = items.concat(response.Responses[metadata.tablePath]);
            }
        }
        return items;
    }

    /**
     * Put an array of documents into DynamoDB in batches.
     */
    // TODO: ... how do we update the indexColumn values here ... ?
    async batchWrite<Entity> (entityClassOrName: EntityTarget<Entity>, writes: BatchWriteItem[]) {
        const dbClient = new DynamoClient();
        const metadata = this.connection.getMetadata(entityClassOrName);
        const batches = batchHelper.batch(writes, 25);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const requestItems: any = {};
            requestItems[metadata.tablePath] = batch.map(write => {
                const request: any = {};
                request[write.type] = {
                    Item: write.item
                };
                return request;
            });
            await dbClient.batchWrite({
                RequestItems: requestItems
            });
        }
    }
}
