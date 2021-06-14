import { Dialect } from "../Dialect";
import { SelectQueryBuilder } from "../../query-builder/SelectQueryBuilder";
import { InsertQueryBuilder } from "../../query-builder/InsertQueryBuilder";
import { DeleteQueryBuilder } from "../../query-builder/DeleteQueryBuilder";
import { UpdateQueryBuilder } from "../../query-builder/UpdateQueryBuilder";
import { SoftDeleteQueryBuilder } from "../../query-builder/SoftDeleteQueryBuilder";
import { RelationQueryBuilder } from "../../query-builder/RelationQueryBuilder";

export class MongoDialect implements Dialect {

    getSelectQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): SelectQueryBuilder<T> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    getInsertQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): InsertQueryBuilder<T> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    getDeleteQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): DeleteQueryBuilder<T> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    getUpdateQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): UpdateQueryBuilder<T> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    getSoftDeleteQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): SoftDeleteQueryBuilder<T> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    getRelationQueryBuilder<T>(connectionOrQuery: any, queryRunner?: any): RelationQueryBuilder<T> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }
}
