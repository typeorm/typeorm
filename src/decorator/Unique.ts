import {getMetadataArgsStorage} from "../index";
import {UniqueMetadataArgs} from "../metadata-args/UniqueMetadataArgs";

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique<Entity>(name: string, fields: (keyof Entity)[]): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique<Entity>(fields: (keyof Entity)[]): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique<Entity>(fields: (object?: any) => ((keyof Entity)[]|{ [key in keyof Entity]: number })): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique<Entity>(name: string, fields: (object?: any) => ((keyof Entity)[]|{ [key: string]: number })): Function;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique<Entity>(nameOrFields?: string|(keyof Entity)[]|((object: any) => ((keyof Entity)[]|{ [key in keyof Entity]: number })),
                       maybeFields?: ((object?: any) => ((keyof Entity)[]|{ [key in keyof Entity]: number }))|(keyof Entity)[]): Function {
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
