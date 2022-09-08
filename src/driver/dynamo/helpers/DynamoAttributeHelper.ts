import { BeginsWith } from "../models/DynamoFindOptions"
import { poundToUnderscore } from "./DynamoTextHelper"
import { isNotEmpty } from "./DynamoObjectHelper"

export const dynamoAttributeHelper = {
    toAttributeNames(
        object: any,
        beginsWith?: BeginsWith,
        attributeNames?: any,
    ) {
        if (isNotEmpty(object)) {
            attributeNames = attributeNames || {}
            const keys = Object.keys(object)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                attributeNames[`#${poundToUnderscore(key)}`] = key
            }
        }
        if (beginsWith) {
            attributeNames[`#${poundToUnderscore(beginsWith.attribute)}`] =
                beginsWith.attribute
        }
        return attributeNames
    },
}
