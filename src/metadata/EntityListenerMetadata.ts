import {EventListenerType} from "./types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../metadata-args/EntityListenerMetadataArgs";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * This metadata contains all information about entity's listeners.
 */
export class EntityListenerMetadata {

    // ---------------------------------------------------------------------
    // Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    target: Function|string;

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

    constructor(args: EntityListenerMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;
        this.type = args.type;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Checks if entity listener is allowed to be executed on the given entity.
     */
    isAllowed(entity: ObjectLiteral) { // todo: create in entity metadata method like isInherited?
        return this.target === entity.constructor || // todo: .constructor won't work for entity schemas
            (this.target instanceof Function && entity.constructor.prototype instanceof this.target); // todo: also need to implement entity schema inheritance
    }

}