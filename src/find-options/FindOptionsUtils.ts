import {FindManyOptions} from "./FindManyOptions";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindOneOptions} from "./FindOneOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Utilities to work with FindOptions.
 */
export class FindOptionsUtils {

    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOneOptions(object: any): object is FindOneOptions<any> {
        const possibleOptions: FindOneOptions<any> = object;
        return possibleOptions &&
                (
                    possibleOptions.where instanceof Object ||
                    possibleOptions.join instanceof Object ||
                    possibleOptions.order instanceof Object
                );
    }

    /**
     * Checks if given object is really instance of FindManyOptions interface.
     */
    static isFindManyOptions(object: any): object is FindManyOptions<any> {
        const possibleOptions: FindManyOptions<any> = object;
        return possibleOptions &&
                (
                    possibleOptions.where instanceof Object ||
                    possibleOptions.join instanceof Object ||
                    possibleOptions.order instanceof Object ||
                    typeof possibleOptions.skip === "number" ||
                    typeof possibleOptions.take === "number"
                );
    }

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindOneOptionsAlias(object: any): string|undefined {
        if (this.isFindOneOptions(object) && object.join)
            return object.join.alias;

        return undefined;
    }

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindManyOptionsAlias(object: any): string|undefined {
        if (this.isFindManyOptions(object) && object.join)
            return object.join.alias;

        return undefined;
    }

    /**
     * Applies give find one options to the given query builder.
     */
    static applyFindOneOptionsOrConditionsToQueryBuilder<T>(qb: QueryBuilder<T>, options: FindOneOptions<T>|Partial<T>|undefined): QueryBuilder<T> {
        if (this.isFindOneOptions(options))
            return this.applyOptionsToQueryBuilder(qb, options);

        if (options)
            return this.applyConditions(qb, options);

        return qb;
    }

    /**
     * Applies give find many options to the given query builder.
     */
    static applyFindManyOptionsOrConditionsToQueryBuilder<T>(qb: QueryBuilder<T>, options: FindManyOptions<T>|Partial<T>|undefined): QueryBuilder<T> {
        if (this.isFindManyOptions(options))
            return this.applyOptionsToQueryBuilder(qb, options);

        if (options)
            return this.applyConditions(qb, options);

        return qb;
    }

    /**
     * Applies give find options to the given query builder.
     */
    static applyOptionsToQueryBuilder<T>(qb: QueryBuilder<T>, options: FindOneOptions<T>|FindManyOptions<T>|undefined): QueryBuilder<T> {

        // if options are not set then simply return query builder. This is made for simplicity of usage.
        if (!options || !this.isFindOneOptions(options))
            return qb;

        // apply all options from FindOptions
        if (options.where)
            this.applyConditions(qb, options.where);

        if ((options as FindManyOptions<T>).skip)
            qb.skip((options as FindManyOptions<T>).skip!);

        if ((options as FindManyOptions<T>).take)
            qb.take((options as FindManyOptions<T>).take!);

        if (options.order)
            Object.keys(options.order).forEach(key => {
                qb.addOrderBy(qb.alias + "." + key, (options as FindOneOptions<T>).order![key as any]);
            });

        if (options.join) {
            if (options.join.leftJoin)
                Object.keys(options.join.leftJoin).forEach(key => {
                    qb.leftJoin(options.join!.leftJoin![key], key);
                });

            if (options.join.innerJoin)
                Object.keys(options.join.innerJoin).forEach(key => {
                    qb.innerJoin(options.join!.innerJoin![key], key);
                });

            if (options.join.leftJoinAndSelect)
                Object.keys(options.join.leftJoinAndSelect).forEach(key => {
                    qb.leftJoinAndSelect(options.join!.leftJoinAndSelect![key], key);
                });

            if (options.join.innerJoinAndSelect)
                Object.keys(options.join.innerJoinAndSelect).forEach(key => {
                    qb.innerJoinAndSelect(options.join!.innerJoinAndSelect![key], key);
                });
        }

        return qb;
    }

    /**
     * Applies given simple conditions set to a given query builder.
     */
    static applyConditions<T>(qb: QueryBuilder<T>, conditions: ObjectLiteral): QueryBuilder<T> {
        Object.keys(conditions).forEach((key, index) => {
            if (conditions![key] === null) {
                qb.andWhere(`${qb.alias}.${key} IS NULL`);

            } else {
                const parameterName = "where_" + index;
                qb.andWhere(`${qb.alias}.${key}=:${parameterName}`)
                    .setParameter(parameterName, conditions![key]);
            }
        });

        return qb;
    }

}