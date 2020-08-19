import { getMetadataArgsStorage } from "../index";
import { UniqueMetadataArgs } from "../metadata-args/UniqueMetadataArgs";

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(name: string, fields: string[]): ClassDecorator & PropertyDecorator;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(fields: string[]): ClassDecorator & PropertyDecorator;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(fields: (object?: any) => (any[] | { [key: string]: number })): ClassDecorator & PropertyDecorator;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(name: string, fields: (object?: any) => (any[] | { [key: string]: number })): ClassDecorator & PropertyDecorator;

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export function Unique(nameOrFields?: string | string[] | ((object: any) => (any[] | { [key: string]: number })),
    maybeFields?: ((object?: any) => (any[] | { [key: string]: number })) | string[]): ClassDecorator & PropertyDecorator {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object?: any) => (any[] | { [key: string]: number })) | string[]>maybeFields : nameOrFields as string[];

    return function (clsOrObject: Function | Object, propertyName?: string | symbol) {

        let columns = fields;

        if (propertyName !== undefined) {
            switch (typeof (propertyName)) {
                case "string":
                    columns = [propertyName];
                    break;

                case "symbol":
                    columns = [propertyName.toString()];
                    break;
            }
        }

        const args: UniqueMetadataArgs = {
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns,
        };
        getMetadataArgsStorage().uniques.push(args);
    };
}
