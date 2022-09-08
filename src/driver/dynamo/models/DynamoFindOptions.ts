import { dynamoAttributeHelper } from "../helpers/DynamoAttributeHelper"
import { poundToUnderscore } from "../helpers/DynamoTextHelper"
import { isNotEmpty } from "../helpers/DynamoObjectHelper"

export class BeginsWith {
    attribute: string
    value: string
}

export class DynamoFindOptions {
    index?: string
    where?: any
    beginsWith?: BeginsWith
    limit?: number
    sort?: string
    exclusiveStartKey?: string

    static toAttributeNames(findOptions: DynamoFindOptions) {
        return dynamoAttributeHelper.toAttributeNames(
            findOptions.where,
            findOptions.beginsWith,
        )
    }

    static toKeyConditionExpression(findOptions: DynamoFindOptions) {
        if (isNotEmpty(findOptions.where)) {
            const keys = Object.keys(findOptions.where)
            const values = []
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                const attribute = poundToUnderscore(key)
                values.push(`#${attribute} = :${attribute}`)
            }
            return DynamoFindOptions.appendBeginsWith(
                values.join(" and "),
                findOptions.beginsWith,
            )
        }
        return undefined
    }

    static appendBeginsWith(expression: string, beginsWith?: BeginsWith) {
        if (beginsWith) {
            const attribute = poundToUnderscore(beginsWith.attribute)
            return `${expression} and begins_with(#${attribute}, :${attribute})`
        }
        return expression
    }

    static toExpressionAttributeValues(findOptions: DynamoFindOptions) {
        if (isNotEmpty(findOptions.where)) {
            const keys = Object.keys(findOptions.where)
            const values: any = {}
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                values[`:${poundToUnderscore(key)}`] = findOptions.where[key]
            }
            if (findOptions.beginsWith) {
                values[
                    `:${poundToUnderscore(findOptions.beginsWith.attribute)}`
                ] = findOptions.beginsWith.value
            }
            return values
        }
        return undefined
    }
}
