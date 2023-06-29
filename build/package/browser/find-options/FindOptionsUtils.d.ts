import { FindManyOptions } from "./FindManyOptions";
import { FindOneOptions } from "./FindOneOptions";
import { SelectQueryBuilder } from "../query-builder/SelectQueryBuilder";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { ObjectLiteral } from "../common/ObjectLiteral";
/**
 * Utilities to work with FindOptions.
 */
export declare class FindOptionsUtils {
    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOneOptions<Entity = any>(obj: any): obj is FindOneOptions<Entity>;
    /**
     * Checks if given object is really instance of FindManyOptions interface.
     */
    static isFindManyOptions<Entity = any>(obj: any): obj is FindManyOptions<Entity>;
    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindManyOptionsAlias(object: any): string | undefined;
    /**
     * Applies give find many options to the given query builder.
     */
    static applyFindManyOptionsOrConditionsToQueryBuilder<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, options: FindManyOptions<T> | Partial<T> | undefined): SelectQueryBuilder<T>;
    /**
     * Applies give find options to the given query builder.
     */
    static applyOptionsToQueryBuilder<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, options: FindOneOptions<T> | FindManyOptions<T> | undefined): SelectQueryBuilder<T>;
    /**
     * Adds joins for all relations and sub-relations of the given relations provided in the find options.
     */
    protected static applyRelationsRecursively(qb: SelectQueryBuilder<any>, allRelations: string[], alias: string, metadata: EntityMetadata, prefix: string): void;
    static joinEagerRelations(qb: SelectQueryBuilder<any>, alias: string, metadata: EntityMetadata): void;
}
