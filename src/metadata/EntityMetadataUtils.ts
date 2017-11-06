import {ObjectLiteral} from "../common/ObjectLiteral";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {EntityMetadata} from "./EntityMetadata";

/**
 * Utils used to work with EntityMetadata objects.
 */
export class EntityMetadataUtils {

    /**
     * Creates a property paths for a given entity.
     */
    static createPropertyPath(metadata: EntityMetadata|EmbeddedMetadata, entity: ObjectLiteral, prefix: string = ""): string[] {
    
        const paths: string[] = [];
    
        Object.keys(entity).forEach(key => {
    
            // check for function is needed in the cases when createPropertyPath used on values containg a function as a value
            // example: .update().set({ name: () => `SUBSTR('', 1, 2)` })
    
            const parentPath: string = prefix ? prefix + "." + key : key;
    
            if (this.searchEmbeddeds(metadata.embeddeds, parentPath)) {
                const subPaths: string[] =
                      metadata.embeddeds.map((embedded: EmbeddedMetadata) => {
                          return this.createPropertyPath(embedded, entity[key], parentPath);
                      }).reduce((a: string[], b: string[]) => [...a, ...b], []);
                paths.push(...subPaths);
            } else {
                paths.push(parentPath);
            }
        });
        return paths;
    }
    
    /**
     * Searches for a key in embeddeds.
     */
    static searchEmbeddeds(embeddeds: EmbeddedMetadata[], key: string): boolean {
        for (let embedded of embeddeds) {
            if (embedded.parentPropertyNames.join(".") === key || this.searchEmbeddeds(embedded.embeddeds, key)) {
                return true;
            }
        }
        return false;
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
