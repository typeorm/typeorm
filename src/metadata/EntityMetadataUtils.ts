import {ObjectLiteral} from "../common/ObjectLiteral";
import {EmbeddedMetadata} from "./EmbeddedMetadata";

/**
 * Utils used to work with EntityMetadata objects.
 */
export class EntityMetadataUtils {

    /**
     * Creates a property paths for a given entity.
     */
    static createPropertyPath(metadata: {embeddeds: any[]}, entity: ObjectLiteral) {

		// check for function is needed in the cases when createPropertyPath used on values containg a function as a value
		// example: .update().set({ name: () => `SUBSTR('', 1, 2)` })

        const paths: string[] = [];
        const givenKeys: string[] = this.getPropertiesPaths(entity);
        
        for (let key of givenKeys) {
			if (key.indexOf('.') !== -1 || this.searchEmbeddeds(metadata.embeddeds, key)) {
				paths.push(key);
			}
		}
		
		return paths;
	}
	
    /**
     * Searches for a key in embeddeds.
     */
	static searchEmbeddeds(embeddeds: EmbeddedMetadata[], key: string): boolean {
		for (let embedded of embeddeds) {
			if (embedded.parentPropertyNames.join('.') === key) {
				return true;
			}
			else {
				return this.searchEmbeddeds(embedded.embeddeds, key);
			}
		}
		return false;
	}
    
    /**
     * Gets all object properties paths.
     */
    static getPropertiesPaths(entity: ObjectLiteral, parsed: Object[] = []): string[] {
		if (parsed.some(obj => obj === entity)) {
			return [];
		}
		let newParsed: Object[] = parsed.slice(0);
		newParsed.push(entity);
		let output: string[] = [];
		for (let key of Object.keys(entity)) {
			this.getPropertiesPaths(entity[key], newParsed).forEach(nested => output.push(key + "." + nested));
			output.push(key);
		}
		return output;
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
