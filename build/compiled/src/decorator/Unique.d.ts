/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export declare function Unique(name: string, fields: string[]): ClassDecorator & PropertyDecorator;
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export declare function Unique(fields: string[]): ClassDecorator & PropertyDecorator;
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export declare function Unique(fields: (object?: any) => (any[] | {
    [key: string]: number;
})): ClassDecorator & PropertyDecorator;
/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 */
export declare function Unique(name: string, fields: (object?: any) => (any[] | {
    [key: string]: number;
})): ClassDecorator & PropertyDecorator;
