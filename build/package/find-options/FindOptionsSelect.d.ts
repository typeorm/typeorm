
import { ObjectID } from "../driver/mongodb/typings";
/**
 * A single property handler for FindOptionsSelect.
 */
export declare type FindOptionsSelectProperty<Property> = Property extends Promise<infer I> ? FindOptionsSelectProperty<I> | boolean : Property extends Array<infer I> ? FindOptionsSelectProperty<I> | boolean : Property extends Function ? never : Property extends Buffer ? boolean : Property extends Date ? boolean : Property extends ObjectID ? boolean : Property extends object ? FindOptionsSelect<Property> : boolean;
/**
 * Select find options.
 */
export declare type FindOptionsSelect<Entity> = {
    [P in keyof Entity]?: FindOptionsSelectProperty<NonNullable<Entity[P]>>;
};
/**
 * Property paths (column names) to be selected by "find" defined as string.
 * Old selection mechanism in TypeORM.
 *
 * @deprecated will be removed in the next version, use FindOptionsSelect type notation instead
 */
export declare type FindOptionsSelectByString<Entity> = (keyof Entity)[];
