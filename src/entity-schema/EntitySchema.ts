import {EntitySchemaOptions} from "./EntitySchemaOptions";

/**
 * Interface for entity metadata mappings stored inside "schemas" instead of models decorated by decorators.
 */
export class EntitySchema<T = any> {

    constructor(public options: EntitySchemaOptions<T>) {
    }

}