import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";

/**
 */
export class CascadesNotAllowedError extends Error {
    name = "CascadesNotAllowedError";

    // todo: remove metadata attribute since its present in relation attribute
    constructor(type: "insert"|"update"|"remove", metadata: EntityMetadata, relation: RelationMetadata) {
        super();
        this.message = `Cascades (${type}) are not allowed for the given relation ${metadata.name}#${relation.joinColumns[0].referencedColumn!.databaseName}`;
    }

}