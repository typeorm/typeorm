"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationJoinColumnBuilder = void 0;
const MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
const ColumnMetadata_1 = require("../metadata/ColumnMetadata");
const UniqueMetadata_1 = require("../metadata/UniqueMetadata");
const ForeignKeyMetadata_1 = require("../metadata/ForeignKeyMetadata");
const OracleDriver_1 = require("../driver/oracle/OracleDriver");
const AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
/**
 * Builds join column for the many-to-one and one-to-one owner relations.
 *
 * Cases it should cover:
 * 1. when join column is set with custom name and without referenced column name
 * we need automatically set referenced column name - primary ids by default
 * @JoinColumn({ name: "custom_name" })
 *
 * 2. when join column is set with only referenced column name
 * we need automatically set join column name - relation name + referenced column name
 * @JoinColumn({ referencedColumnName: "title" })
 *
 * 3. when join column is set without both referenced column name and join column name
 * we need to automatically set both of them
 * @JoinColumn()
 *
 * 4. when join column is not set at all (as in case of @ManyToOne relation)
 * we need to create join column for it with proper referenced column name and join column name
 *
 * 5. when multiple join columns set none of referencedColumnName and name can be optional
 * both options are required
 * @JoinColumn([
 *      { name: "category_title", referencedColumnName: "type" },
 *      { name: "category_title", referencedColumnName: "name" },
 * ])
 *
 * Since for many-to-one relations having JoinColumn decorator is not required,
 * we need to go thought each many-to-one relation without join column decorator set
 * and create join column metadata args for them.
 */
class RelationJoinColumnBuilder {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Builds a foreign key of the many-to-one or one-to-one owner relations.
     */
    build(joinColumns, relation) {
        const referencedColumns = this.collectReferencedColumns(joinColumns, relation);
        const columns = this.collectColumns(joinColumns, relation, referencedColumns);
        if (!referencedColumns.length || !relation.createForeignKeyConstraints)
            return { foreignKey: undefined, columns, uniqueConstraint: undefined }; // this case is possible for one-to-one non owning side and relations with createForeignKeyConstraints = false
        const foreignKey = new ForeignKeyMetadata_1.ForeignKeyMetadata({
            entityMetadata: relation.entityMetadata,
            referencedEntityMetadata: relation.inverseEntityMetadata,
            namingStrategy: this.connection.namingStrategy,
            columns: columns,
            referencedColumns: referencedColumns,
            onDelete: relation.onDelete,
            onUpdate: relation.onUpdate,
            deferrable: relation.deferrable,
        });
        // Oracle does not allow both primary and unique constraints on the same column
        if (this.connection.driver instanceof OracleDriver_1.OracleDriver && columns.every(column => column.isPrimary))
            return { foreignKey, columns, uniqueConstraint: undefined };
        // CockroachDB requires UNIQUE constraints on referenced columns
        if (referencedColumns.length > 0 && relation.isOneToOne) {
            const uniqueConstraint = new UniqueMetadata_1.UniqueMetadata({
                entityMetadata: relation.entityMetadata,
                columns: foreignKey.columns,
                args: {
                    name: this.connection.namingStrategy.relationConstraintName(relation.entityMetadata.tablePath, foreignKey.columns.map(c => c.databaseName)),
                    target: relation.entityMetadata.target,
                }
            });
            uniqueConstraint.build(this.connection.namingStrategy);
            return { foreignKey, columns, uniqueConstraint };
        }
        return { foreignKey, columns, uniqueConstraint: undefined };
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Collects referenced columns from the given join column args.
     */
    collectReferencedColumns(joinColumns, relation) {
        const hasAnyReferencedColumnName = joinColumns.find(joinColumnArgs => !!joinColumnArgs.referencedColumnName);
        const manyToOneWithoutJoinColumn = joinColumns.length === 0 && relation.isManyToOne;
        const hasJoinColumnWithoutAnyReferencedColumnName = joinColumns.length > 0 && !hasAnyReferencedColumnName;
        if (manyToOneWithoutJoinColumn || hasJoinColumnWithoutAnyReferencedColumnName) { // covers case3 and case1
            return relation.inverseEntityMetadata.primaryColumns;
        }
        else { // cases with referenced columns defined
            return joinColumns.map(joinColumn => {
                const referencedColumn = relation.inverseEntityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName); // todo: can we also search in relations?
                if (!referencedColumn)
                    throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);
                return referencedColumn;
            });
        }
    }
    /**
     * Collects columns from the given join column args.
     */
    collectColumns(joinColumns, relation, referencedColumns) {
        return referencedColumns.map(referencedColumn => {
            // in the case if relation has join column with only name set we need this check
            const joinColumnMetadataArg = joinColumns.find(joinColumn => {
                return (!joinColumn.referencedColumnName || joinColumn.referencedColumnName === referencedColumn.propertyName) &&
                    !!joinColumn.name;
            });
            const joinColumnName = joinColumnMetadataArg ? joinColumnMetadataArg.name : this.connection.namingStrategy.joinColumnName(relation.propertyName, referencedColumn.propertyName);
            let relationalColumn = relation.entityMetadata.ownColumns.find(column => column.databaseName === joinColumnName);
            if (!relationalColumn) {
                relationalColumn = new ColumnMetadata_1.ColumnMetadata({
                    connection: this.connection,
                    entityMetadata: relation.entityMetadata,
                    args: {
                        target: "",
                        mode: "virtual",
                        propertyName: relation.propertyName,
                        options: {
                            name: joinColumnName,
                            type: referencedColumn.type,
                            length: !referencedColumn.length
                                && (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                                && (referencedColumn.generationStrategy === "uuid" || referencedColumn.type === "uuid")
                                ? "36"
                                : referencedColumn.length,
                            width: referencedColumn.width,
                            charset: referencedColumn.charset,
                            collation: referencedColumn.collation,
                            precision: referencedColumn.precision,
                            scale: referencedColumn.scale,
                            zerofill: referencedColumn.zerofill,
                            unsigned: referencedColumn.unsigned,
                            comment: referencedColumn.comment,
                            enum: referencedColumn.enum,
                            enumName: referencedColumn.enumName,
                            primary: relation.isPrimary,
                            nullable: relation.isNullable,
                        }
                    }
                });
                relation.entityMetadata.registerColumn(relationalColumn);
            }
            relationalColumn.referencedColumn = referencedColumn; // its important to set it here because we need to set referenced column for user defined join column
            relationalColumn.type = referencedColumn.type; // also since types of relational column and join column must be equal we override user defined column type
            relationalColumn.relationMetadata = relation;
            relationalColumn.build(this.connection);
            return relationalColumn;
        });
    }
}
exports.RelationJoinColumnBuilder = RelationJoinColumnBuilder;
//# sourceMappingURL=RelationJoinColumnBuilder.js.map