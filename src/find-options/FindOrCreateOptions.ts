import type { FindOptionsWhere } from "./FindOptionsWhere"
import type { DeepPartial } from "../common/DeepPartial"

/**
 * Options for the `findOrCreate` method.
 */
export interface FindOrCreateOptions<Entity> {
    /**
     * Conditions used to find an existing entity.
     */
    where: FindOptionsWhere<Entity>

    /**
     * Additional fields to set when creating a new entity.
     * These are merged with `where` conditions during creation.
     */
    create?: DeepPartial<Entity>
}
