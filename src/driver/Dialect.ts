import { Connection } from "../connection/Connection";
import { QueryRunner } from "../query-runner/QueryRunner";
import { SelectQueryBuilder } from "../query-builder/SelectQueryBuilder";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { InsertQueryBuilder } from "../query-builder/InsertQueryBuilder";
import { DeleteQueryBuilder } from "../query-builder/DeleteQueryBuilder";
import { UpdateQueryBuilder } from "../query-builder/UpdateQueryBuilder";
import { SoftDeleteQueryBuilder } from "../query-builder/SoftDeleteQueryBuilder";
import { RelationQueryBuilder } from "../query-builder/RelationQueryBuilder";

export interface Dialect {
    /**
     * Retrieves a Select Query builder given a connection and optionally a QueryRunner.
     */
    getSelectQueryBuilder<T>(connection: Connection, queryRunner?: QueryRunner | undefined): SelectQueryBuilder<T>;

    /**
     * Retrieves a Select Query builder using the connection and state of an existing query builder.
     */
    getSelectQueryBuilder<T>(query: QueryBuilder<T>): SelectQueryBuilder<T>;

    /**
     * Retrieves an Insert Query builder given a connection and optionally a QueryRunner.
     */
    getInsertQueryBuilder<T>(connection: Connection, queryRunner?: QueryRunner | undefined): InsertQueryBuilder<T>;

    /**
     * Retrieves a Insert Query builder using the connection and state of an existing query builder.
     */
    getInsertQueryBuilder<T>(query: QueryBuilder<T>): InsertQueryBuilder<T>;

    /**
     * Retrieves a Delete Query builder given a connection and optionally a QueryRunner.
     */
    getDeleteQueryBuilder<T>(connection: Connection, queryRunner?: QueryRunner | undefined): DeleteQueryBuilder<T>;

    /**
     * Retrieves a Delete Query builder using the connection and state of an existing query builder.
     */
    getDeleteQueryBuilder<T>(query: QueryBuilder<T>): DeleteQueryBuilder<T>;

    /**
     * Retrieves an Update Query builder given a connection and optionally a QueryRunner.
     */
    getUpdateQueryBuilder<T>(connection: Connection, queryRunner?: QueryRunner | undefined): UpdateQueryBuilder<T>;

    /**
     * Retrieves an Update Query builder using the connection and state of an existing query builder.
     */
    getUpdateQueryBuilder<T>(query: QueryBuilder<T>): UpdateQueryBuilder<T>;

    /**
     * Retrieves a Soft-Delete Query builder given a connection and optionally a QueryRunner.
     */
    getSoftDeleteQueryBuilder<T>(connection: Connection, queryRunner?: QueryRunner | undefined): SoftDeleteQueryBuilder<T>;

    /**
     * Retrieves a Soft-Delete Query builder using the connection and state of an existing query builder.
     */
    getSoftDeleteQueryBuilder<T>(query: QueryBuilder<T>): SoftDeleteQueryBuilder<T>;

    /**
     * Retrieves a Relation Query builder given a connection and optionally a QueryRunner.
     */
    getRelationQueryBuilder<T>(connection: Connection, queryRunner?: QueryRunner | undefined): RelationQueryBuilder<T>;

    /**
     * Retrieves a Relation Query builder using the connection and state of an existing query builder.
     */
    getRelationQueryBuilder<T>(query: QueryBuilder<T>): RelationQueryBuilder<T>;
}
