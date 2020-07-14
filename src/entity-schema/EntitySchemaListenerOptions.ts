import {EventListenerType} from "../metadata/types/EventListenerTypes";

export interface EntitySchemaListenerOptions {
    /**
     * Type of Event to Listen to
     */
    type: EventListenerType;

    /**
     * Entity's property name to which listener is applied.
     */
    propertyName: string;
}
