import { attributeHelper } from "../helpers/AttributeHelper";

export class UpdateOptions {
    type: "ADD" | "DELETE" | "REMOVE" | "SET"; // ADD,DELETE,REMOVE,SET
    values: any;
    where: any;

    static toAttributeNames (updateOptions: UpdateOptions) {
        return attributeHelper.toAttributeNames(updateOptions.values);
    }

    static toExpressionAttributeValues (updateOptions: UpdateOptions) {
        const keys = Object.keys(updateOptions.values);
        const values: any = {};
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            values[`:${key}`] = updateOptions.values[key];
        }
        return values;
    }

    static toUpdateExpression (options: UpdateOptions) {
        const values = Object.keys(options.values).map(key => {
            return `#${key} :${key}`;
        }).join(", ");
        return `${options.type} ${values}`;
    }
}
