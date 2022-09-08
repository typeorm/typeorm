import { DynamoUpdateExpressionOptions } from "../models/DynamoUpdateExpressionOptions"
import { DynamoFindOptions } from "../models/DynamoFindOptions"
import { buildPartitionKey } from "./DynamoGlobalSecondaryIndexHelper"
import { IndexMetadata } from "../../../metadata/IndexMetadata"
import { isNotEmpty } from "./DynamoObjectHelper"

const indexedWhere = (
    options: DynamoFindOptions,
    indices?: IndexMetadata[],
) => {
    indices = indices || []
    const index = indices.find((index) => {
        return index.name === options.index
    })
    const where: any = {}
    if (index && options.where) {
        const columns = index.columns || []
        const partitionKey = buildPartitionKey(columns)
        const values = []
        for (let i = 0; i < columns.length; i += 1) {
            const column = columns[i]
            const value = options.where[column.propertyName]
            values.push(value)
        }
        where[partitionKey] = values.join("#")
    }
    return isNotEmpty(where) ? where : options.where
}

export const dynamoParamHelper = {
    find(
        tableName: string,
        options: DynamoFindOptions,
        indices?: IndexMetadata[],
    ) {
        options.where = indexedWhere(options, indices)
        const params: any = {
            TableName: tableName,
            KeyConditionExpression:
                DynamoFindOptions.toKeyConditionExpression(options),
            ExpressionAttributeNames:
                DynamoFindOptions.toAttributeNames(options),
            ExpressionAttributeValues:
                DynamoFindOptions.toExpressionAttributeValues(options),
            ScanIndexForward: options.sort !== "DESC",
        }
        if (options.index) {
            params.IndexName = options.index
        }
        if (options.limit) {
            params.Limit = options.limit
        }
        if (options.exclusiveStartKey) {
            params.ExclusiveStartKey = options.exclusiveStartKey
        }
        return params
    },
    update(tableName: string, options: DynamoUpdateExpressionOptions) {
        return {
            TableName: tableName,
            Key: options.where,
            UpdateExpression:
                DynamoUpdateExpressionOptions.toUpdateExpression(options),
            ExpressionAttributeNames:
                DynamoUpdateExpressionOptions.toAttributeNames(options),
            ExpressionAttributeValues:
                DynamoUpdateExpressionOptions.toExpressionAttributeValues(
                    options,
                ),
        }
    },
}
