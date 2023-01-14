import type { MongoEntityManager } from "../entity-manager/MongoEntityManager"
import type { SqljsEntityManager } from "../entity-manager/SqljsEntityManager"
import type { EntitySchema } from "../entity-schema/EntitySchema"
import type { FindOperator } from "../find-options/FindOperator"
import type { EqualOperator } from "../find-options/EqualOperator"
import type { Query } from "../driver/Query"
import type { RdbmsSchemaBuilder } from "../schema-builder/RdbmsSchemaBuilder"
import type { Subject } from "../persistence/Subject"
import type { QueryBuilder } from "../query-builder/QueryBuilder"
import type { SelectQueryBuilder } from "../query-builder/SelectQueryBuilder"
import type { UpdateQueryBuilder } from "../query-builder/UpdateQueryBuilder"
import type { DeleteQueryBuilder } from "../query-builder/DeleteQueryBuilder"
import type { SoftDeleteQueryBuilder } from "../query-builder/SoftDeleteQueryBuilder"
import type { InsertQueryBuilder } from "../query-builder/InsertQueryBuilder"
import type { RelationQueryBuilder } from "../query-builder/RelationQueryBuilder"
import type { Brackets } from "../query-builder/Brackets"
import type { Table } from "../schema-builder/table/Table"
import type { TableCheck } from "../schema-builder/table/TableCheck"
import type { TableColumn } from "../schema-builder/table/TableColumn"
import type { TableExclusion } from "../schema-builder/table/TableExclusion"
import type { TableForeignKey } from "../schema-builder/table/TableForeignKey"
import type { TableIndex } from "../schema-builder/table/TableIndex"
import type { TableUnique } from "../schema-builder/table/TableUnique"
import type { View } from "../schema-builder/view/View"
import type { NotBrackets } from "../query-builder/NotBrackets"
import type { EntityMetadata } from "../metadata/EntityMetadata"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { MssqlParameter } from "../driver/sqlserver/MssqlParameter"
import { DataSource } from "../data-source"
import { BaseEntity } from "../repository/BaseEntity"
import { JoinOperator } from "../find-options/JoinOperator"

export class InstanceChecker {
    static isMssqlParameter(obj: unknown): obj is MssqlParameter {
        return this.check(obj, "MssqlParameter")
    }
    static isEntityMetadata(obj: unknown): obj is EntityMetadata {
        return this.check(obj, "EntityMetadata")
    }
    static isColumnMetadata(obj: unknown): obj is ColumnMetadata {
        return this.check(obj, "ColumnMetadata")
    }
    static isQueryBuilder(obj: unknown): obj is QueryBuilder<any> {
        return (
            this.check(obj, "QueryBuilder") ||
            this.check(obj, "SelectQueryBuilder") ||
            this.check(obj, "InsertQueryBuilder") ||
            this.check(obj, "DeleteQueryBuilder") ||
            this.check(obj, "UpdateQueryBuilder") ||
            this.check(obj, "SoftDeleteQueryBuilder") ||
            this.check(obj, "RelationQueryBuilder")
        )
    }
    static isSelectQueryBuilder(obj: unknown): obj is SelectQueryBuilder<any> {
        return this.check(obj, "SelectQueryBuilder")
    }
    static isInsertQueryBuilder(obj: unknown): obj is InsertQueryBuilder<any> {
        return this.check(obj, "InsertQueryBuilder")
    }
    static isDeleteQueryBuilder(obj: unknown): obj is DeleteQueryBuilder<any> {
        return this.check(obj, "DeleteQueryBuilder")
    }
    static isUpdateQueryBuilder(obj: unknown): obj is UpdateQueryBuilder<any> {
        return this.check(obj, "UpdateQueryBuilder")
    }
    static isSoftDeleteQueryBuilder(
        obj: unknown,
    ): obj is SoftDeleteQueryBuilder<any> {
        return this.check(obj, "SoftDeleteQueryBuilder")
    }
    static isRelationQueryBuilder(
        obj: unknown,
    ): obj is RelationQueryBuilder<any> {
        return this.check(obj, "RelationQueryBuilder")
    }
    static isBrackets(obj: unknown): obj is Brackets {
        return this.check(obj, "Brackets") || this.check(obj, "NotBrackets")
    }
    static isNotBrackets(obj: unknown): obj is NotBrackets {
        return this.check(obj, "NotBrackets")
    }
    static isSubject(obj: unknown): obj is Subject {
        return this.check(obj, "Subject")
    }
    static isRdbmsSchemaBuilder(obj: unknown): obj is RdbmsSchemaBuilder {
        return this.check(obj, "RdbmsSchemaBuilder")
    }
    static isMongoEntityManager(obj: unknown): obj is MongoEntityManager {
        return this.check(obj, "MongoEntityManager")
    }
    static isSqljsEntityManager(obj: unknown): obj is SqljsEntityManager {
        return this.check(obj, "SqljsEntityManager")
    }
    static isEntitySchema(obj: unknown): obj is EntitySchema {
        return this.check(obj, "EntitySchema")
    }
    static isBaseEntityConstructor(obj: unknown): obj is typeof BaseEntity {
        return (
            typeof obj === "function" &&
            typeof (obj as typeof BaseEntity).hasId === "function" &&
            typeof (obj as typeof BaseEntity).save === "function" &&
            typeof (obj as typeof BaseEntity).useDataSource === "function"
        )
    }
    static isFindOperator(obj: unknown): obj is FindOperator<any> {
        return (
            this.check(obj, "FindOperator") || this.check(obj, "EqualOperator")
        )
    }

    static isJoinOperator(obj: unknown): obj is JoinOperator {
        return this.check(obj, "JoinOperator")
    }

    static isEqualOperator(obj: unknown): obj is EqualOperator<any> {
        return this.check(obj, "EqualOperator")
    }
    static isQuery(obj: unknown): obj is Query {
        return this.check(obj, "Query")
    }
    static isTable(obj: unknown): obj is Table {
        return this.check(obj, "Table")
    }
    static isTableCheck(obj: unknown): obj is TableCheck {
        return this.check(obj, "TableCheck")
    }
    static isTableColumn(obj: unknown): obj is TableColumn {
        return this.check(obj, "TableColumn")
    }
    static isTableExclusion(obj: unknown): obj is TableExclusion {
        return this.check(obj, "TableExclusion")
    }
    static isTableForeignKey(obj: unknown): obj is TableForeignKey {
        return this.check(obj, "TableForeignKey")
    }
    static isTableIndex(obj: unknown): obj is TableIndex {
        return this.check(obj, "TableIndex")
    }
    static isTableUnique(obj: unknown): obj is TableUnique {
        return this.check(obj, "TableUnique")
    }
    static isView(obj: unknown): obj is View {
        return this.check(obj, "View")
    }
    static isDataSource(obj: unknown): obj is DataSource {
        return this.check(obj, "DataSource")
    }

    private static check(obj: unknown, name: string) {
        return (
            typeof obj === "object" &&
            obj !== null &&
            (obj as { "@instanceof": Symbol })["@instanceof"] ===
                Symbol.for(name)
        )
    }
}
