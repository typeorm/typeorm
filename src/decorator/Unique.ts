import {getMetadataArgsStorage} from "../index";
import {UniqueMetadataArgs} from "../metadata-args/UniqueMetadataArgs";

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(name: string, fields: string[]): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(fields: string[]): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(fields: (object?: any) => (any[]|{ [key: string]: number })): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(name: string, fields: (object?: any) => (any[]|{ [key: string]: number })): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(nameOrFields?: string|string[]|((object: any) => (any[]|{ [key: string]: number })),
                       maybeFields?: ((object?: any) => (any[]|{ [key: string]: number }))|string[]): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object?: any) => (any[]|{ [key: string]: number }))|string[]> maybeFields : nameOrFields as string[];

    return function (clsOrObject: Function|Object, propertyName?: string) {
        const args: UniqueMetadataArgs = {
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields
        };
        getMetadataArgsStorage().uniques.push(args);
    };
}
