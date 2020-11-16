import { EntityMetadata } from "../metadata/EntityMetadata";

export class EntityColumnNotFound extends Error {
    name = "EntityColumnNotFound";

    constructor(metadata: EntityMetadata, propertyPath: string) {
        super();
        Object.setPrototypeOf(this, EntityColumnNotFound.prototype);
        this.message = `Column "${propertyPath}" not found in entity "${metadata.name}".`;
    }

}
