import {EventListenerType} from "./types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../metadata-args/EntityListenerMetadataArgs";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "./EntityMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import { TypeORMError } from "..";

/**
 * This metadata contains all information about entity's listeners.
 */
export class EntityListenerMetadata {

    // ---------------------------------------------------------------------
    // Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata of the listener.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata of the listener, in the case if listener is in embedded.
     */
    embeddedMetadata?: EmbeddedMetadata;

    /**
     * Target class to which metadata is applied.
     * This can be different then entityMetadata.target in the case if listener is in the embedded.
     */
    target: Function;

    /**
     * Target's property name to which this metadata is applied.
     */
    propertyName: string;

    /**
     * The type of the listener.
     */
    type: EventListenerType;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: { entityMetadata: EntityMetadata, embeddedMetadata?: EmbeddedMetadata, args: EntityListenerMetadataArgs }) {
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata;
        this.target = options.args.target;
        this.propertyName = options.args.propertyName;
        this.type = options.args.type;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Executes listener method of the given entity.
     */
    execute(entity: ObjectLiteral) {
        if (!this.embeddedMetadata)
            return this.target.prototype[this.propertyName].call(entity);

        this.callEntityEmbeddedMethod(entity, this.embeddedMetadata.propertyPath);
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    /**
     * Calls embedded entity listener method no matter how nested it is.
     */
    protected callEntityEmbeddedMethod(entity: ObjectLiteral, propertyPath: string): void {
        const embeddedTarget = this.entityMetadata.findEmbeddedWithPropertyPath(propertyPath)?.type;
        const embeddedValue = propertyPath.split(".").reduce((embeddedValue, key) => embeddedValue?.[key], entity);

        if (typeof embeddedTarget === "string") {
            // target type will only be a string if the "entity" is a junction table which is not possible to embed
            throw new TypeORMError("Unable to embed junction table");
        }

        if (embeddedValue instanceof Array) {
            embeddedValue.map((embedded: ObjectLiteral) => embeddedTarget?.prototype[this.propertyName].call(embedded));
        } else if (embeddedValue) {
            embeddedTarget?.prototype[this.propertyName].call(embeddedValue);
        }
    }

}
