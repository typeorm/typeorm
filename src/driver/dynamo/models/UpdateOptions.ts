import { attributeHelper } from '../helpers/AttributeHelper'
import mixin from  '../helpers/mixin'

export enum UpdateType {
    // eslint-disable-next-line no-unused-vars
    ADD = 'ADD',
    // eslint-disable-next-line no-unused-vars
    DELETE = 'DELETE',
    // eslint-disable-next-line no-unused-vars
    REMOVE = 'REMOVE',
    // eslint-disable-next-line no-unused-vars
    SET ='SET'
}

export class UpdateOptions {
    addValues?: any
    setValues?: any
    where: any

    static toAttributeNames (updateOptions: UpdateOptions) {
        const values = mixin(updateOptions.addValues || {}, updateOptions.setValues || {})
        return attributeHelper.toAttributeNames(values)
    }

    static toExpressionAttributeValues (updateOptions: UpdateOptions) {
        const updateOptionValues = mixin(updateOptions.addValues || {}, updateOptions.setValues || {})
        const keys = Object.keys(updateOptionValues)
        const values: any = {}
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const attributeName = key.replace('#', '_')
            values[`:${attributeName}`] = updateOptionValues[key]
        }
        return values
    }

    static toUpdateExpression (options: UpdateOptions) {
        const setExpression = this._toUpdateExpression(options.setValues, UpdateType.SET)
        const addExpression = this._toUpdateExpression(options.addValues, UpdateType.ADD)
        return `${setExpression} ${addExpression}`.trim()
    }

    static _toUpdateExpression (values: any, type: UpdateType) {
        if (values) {
            const commonSeparatedValues = Object.keys(values).map(key => {
                const attributeName = key.replace('#', '_')
                switch (type) {
                    case UpdateType.ADD:
                        return `#${attributeName} :${attributeName}`
                    case UpdateType.SET:
                        return `#${attributeName} = :${attributeName}`
                    default:
                        throw new Error(`update type is not supported yet: ${type}`)
                }
            }).join(', ')
            return `${type} ${commonSeparatedValues}`
        }
        return ''
    }
}
