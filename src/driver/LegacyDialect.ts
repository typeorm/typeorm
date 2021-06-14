import { Dialect } from "./Dialect";
import { SelectQueryBuilder } from "../query-builder/SelectQueryBuilder";
import { InsertQueryBuilder } from "../query-builder/InsertQueryBuilder";
import { DeleteQueryBuilder } from "../query-builder/DeleteQueryBuilder";
import { UpdateQueryBuilder } from "../query-builder/UpdateQueryBuilder";
import { SoftDeleteQueryBuilder } from "../query-builder/SoftDeleteQueryBuilder";
import { RelationQueryBuilder } from "../query-builder/RelationQueryBuilder";

/**
 * This dialect effectively keeps the same behaviors as the original
 * where the base QueryBuilders have code in place to maintain multiple
 * dialects at once.
 */
export class LegacyDialect implements Dialect{
    /**
     * Retrieves a Select Query builder.
     */
    getSelectQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): SelectQueryBuilder<T> {
        // There's a bizarre circular dependency weirdness that we're trying to get around with this
        // Once we extract the imports back to drivers we can remove this `require`
        const { SelectQueryBuilder: Builder } = require("../query-builder/SelectQueryBuilder");

        if (connectionOrQuery instanceof Builder) {
            return connectionOrQuery;
        }

        return new Builder(connectionOrQuery, queryRunner);
    }

    /**
     * Retrieves an Insert Query builder for this driver.
     */
    getInsertQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): InsertQueryBuilder<T> {
        // There's a bizarre circular dependency weirdness that we're trying to get around with this
        // Once we extract the imports back to drivers we can remove this `require`
        const { InsertQueryBuilder: Builder } = require("../query-builder/InsertQueryBuilder");

        if (connectionOrQuery instanceof Builder) {
            return connectionOrQuery;
        }

        return new Builder(connectionOrQuery, queryRunner);
    }

    /**
     * Retrieves a Delete Query builder for this driver.
     */
    getDeleteQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): DeleteQueryBuilder<T> {
        // There's a bizarre circular dependency weirdness that we're trying to get around with this
        // Once we extract the imports back to drivers we can remove this `require`
        const { DeleteQueryBuilder: Builder } = require("../query-builder/DeleteQueryBuilder");

        if (connectionOrQuery instanceof Builder) {
            return connectionOrQuery;
        }

        return new Builder(connectionOrQuery, queryRunner);
    }

    /**
     * Retrieves an Update Query builder for this driver.
     */
    getUpdateQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): UpdateQueryBuilder<T> {
        // There's a bizarre circular dependency weirdness that we're trying to get around with this
        // Once we extract the imports back to drivers we can remove this `require`
        const { UpdateQueryBuilder: Builder } = require("../query-builder/UpdateQueryBuilder");

        if (connectionOrQuery instanceof Builder) {
            return connectionOrQuery;
        }

        return new Builder(connectionOrQuery, queryRunner);
    }

    /**
     * Retrieves a Delete Query builder for this driver.
     */
    getSoftDeleteQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): SoftDeleteQueryBuilder<T> {
        // There's a bizarre circular dependency weirdness that we're trying to get around with this
        // Once we extract the imports back to drivers we can remove this `require`
        const { SoftDeleteQueryBuilder: Builder } = require("../query-builder/SoftDeleteQueryBuilder");

        if (connectionOrQuery instanceof Builder) {
            return connectionOrQuery;
        }

        return new Builder(connectionOrQuery, queryRunner);
    }

    /**
     * Retrieves a Relation Query builder for this driver.
     */
    getRelationQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): RelationQueryBuilder<T> {
        // There's a bizarre circular dependency weirdness that we're trying to get around with this
        // Once we extract the imports back to drivers we can remove this `require`
        const { RelationQueryBuilder: Builder } = require("../query-builder/RelationQueryBuilder");

        if (connectionOrQuery instanceof Builder) {
            return connectionOrQuery;
        }

        return new Builder(connectionOrQuery, queryRunner);
    }
}
