import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "./EntityMetadata";

/**
 * Utils used to work with EntityMetadata objects.
 */
export class EntityMetadataUtils {

    /**
     * Creates a property paths for a given entity.
     */
    static createPropertyPath(metadata: EntityMetadata, entity: ObjectLiteral, prefix: string = "") {
        const paths: string[] = [];
        Object.keys(entity).forEach(key => {

            // check for function is needed in the cases when createPropertyPath used on values containing a function as a value
            // example: .update().set({ name: () => `SUBSTR('', 1, 2)` })
            const parentPath = prefix ? prefix + "." + key : key;
            if (metadata.hasEmbeddedWithPropertyPath(parentPath)) {
                const subPaths = this.createPropertyPath(metadata, entity[key], key);
                paths.push(...subPaths);
            } else {
                const path = prefix ? prefix + "." + key : key;
                paths.push(path);
            }
        });
        return paths;
    }

    /**
     * Creates a property paths for a given entity.
     */
    static getPropertyPathValue(entity: ObjectLiteral, propertyPath: string) {
        const properties = propertyPath.split(".");
        const recursive = (object: ObjectLiteral): any => {
            const propertyName = properties.shift();
            const value = propertyName ? object[propertyName] : object;
            if (properties.length)
                return recursive(value);

            return value;
        };
        return recursive(entity);
    }

}