
import { ObjectID } from "../driver/mongodb/typings";
/**
 * A single property handler for FindOptionsOrder.
 */
export declare type FindOptionsOrderProperty<Property> = Property extends Promise<infer I> ? FindOptionsOrderProperty<NonNullable<I>> : Property extends Array<infer I> ? FindOptionsOrderProperty<NonNullable<I>> : Property extends Function ? never : Property extends Buffer ? FindOptionsOrderValue : Property extends Date ? FindOptionsOrderValue : Property extends ObjectID ? FindOptionsOrderValue : Property extends object ? FindOptionsOrder<Property> : FindOptionsOrderValue;
/**
 * Order by find options.
 */
export declare type FindOptionsOrder<Entity> = {
    [P in keyof Entity]?: FindOptionsOrderProperty<NonNullable<Entity[P]>>;
};
/**
 * Value of order by in find options.
 */
export declare type FindOptionsOrderValue = "ASC" | "DESC" | "asc" | "desc" | 1 | -1 | {
    direction?: "asc" | "desc" | "ASC" | "DESC";
    nulls?: "first" | "last" | "FIRST" | "LAST";
};
