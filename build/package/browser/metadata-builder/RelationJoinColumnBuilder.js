import { MysqlDriver } from "../driver/mysql/MysqlDriver";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
import { UniqueMetadata } from "../metadata/UniqueMetadata";
import { ForeignKeyMetadata } from "../metadata/ForeignKeyMetadata";
import { OracleDriver } from "../driver/oracle/OracleDriver";
import { AuroraDataApiDriver } from "../driver/aurora-data-api/AuroraDataApiDriver";
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
var RelationJoinColumnBuilder = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationJoinColumnBuilder(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Builds a foreign key of the many-to-one or one-to-one owner relations.
     */
    RelationJoinColumnBuilder.prototype.build = function (joinColumns, relation) {
        var referencedColumns = this.collectReferencedColumns(joinColumns, relation);
        var columns = this.collectColumns(joinColumns, relation, referencedColumns);
        if (!referencedColumns.length || !relation.createForeignKeyConstraints)
            return { foreignKey: undefined, columns: columns, uniqueConstraint: undefined }; // this case is possible for one-to-one non owning side and relations with createForeignKeyConstraints = false
        var foreignKey = new ForeignKeyMetadata({
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
        if (this.connection.driver instanceof OracleDriver && columns.every(function (column) { return column.isPrimary; }))
            return { foreignKey: foreignKey, columns: columns, uniqueConstraint: undefined };
        // CockroachDB requires UNIQUE constraints on referenced columns
        if (referencedColumns.length > 0 && relation.isOneToOne) {
            var uniqueConstraint = new UniqueMetadata({
                entityMetadata: relation.entityMetadata,
                columns: foreignKey.columns,
                args: {
                    name: this.connection.namingStrategy.relationConstraintName(relation.entityMetadata.tablePath, foreignKey.columns.map(function (c) { return c.databaseName; })),
                    target: relation.entityMetadata.target,
                }
            });
            uniqueConstraint.build(this.connection.namingStrategy);
            return { foreignKey: foreignKey, columns: columns, uniqueConstraint: uniqueConstraint };
        }
        return { foreignKey: foreignKey, columns: columns, uniqueConstraint: undefined };
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Collects referenced columns from the given join column args.
     */
    RelationJoinColumnBuilder.prototype.collectReferencedColumns = function (joinColumns, relation) {
        var hasAnyReferencedColumnName = joinColumns.find(function (joinColumnArgs) { return !!joinColumnArgs.referencedColumnName; });
        var manyToOneWithoutJoinColumn = joinColumns.length === 0 && relation.isManyToOne;
        var hasJoinColumnWithoutAnyReferencedColumnName = joinColumns.length > 0 && !hasAnyReferencedColumnName;
        if (manyToOneWithoutJoinColumn || hasJoinColumnWithoutAnyReferencedColumnName) { // covers case3 and case1
            return relation.inverseEntityMetadata.primaryColumns;
        }
        else { // cases with referenced columns defined
            return joinColumns.map(function (joinColumn) {
                var referencedColumn = relation.inverseEntityMetadata.ownColumns.find(function (column) { return column.propertyName === joinColumn.referencedColumnName; }); // todo: can we also search in relations?
                if (!referencedColumn)
                    throw new Error("Referenced column " + joinColumn.referencedColumnName + " was not found in entity " + relation.inverseEntityMetadata.name);
                return referencedColumn;
            });
        }
    };
    /**
     * Collects columns from the given join column args.
     */
    RelationJoinColumnBuilder.prototype.collectColumns = function (joinColumns, relation, referencedColumns) {
        var _this = this;
        return referencedColumns.map(function (referencedColumn) {
            // in the case if relation has join column with only name set we need this check
            var joinColumnMetadataArg = joinColumns.find(function (joinColumn) {
                return (!joinColumn.referencedColumnName || joinColumn.referencedColumnName === referencedColumn.propertyName) &&
                    !!joinColumn.name;
            });
            var joinColumnName = joinColumnMetadataArg ? joinColumnMetadataArg.name : _this.connection.namingStrategy.joinColumnName(relation.propertyName, referencedColumn.propertyName);
            var relationalColumn = relation.entityMetadata.ownColumns.find(function (column) { return column.databaseName === joinColumnName; });
            if (!relationalColumn) {
                relationalColumn = new ColumnMetadata({
                    connection: _this.connection,
                    entityMetadata: relation.entityMetadata,
                    args: {
                        target: "",
                        mode: "virtual",
                        propertyName: relation.propertyName,
                        options: {
                            name: joinColumnName,
                            type: referencedColumn.type,
                            length: !referencedColumn.length
                                && (_this.connection.driver instanceof MysqlDriver || _this.connection.driver instanceof AuroraDataApiDriver)
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
            relationalColumn.build(_this.connection);
            return relationalColumn;
        });
    };
    return RelationJoinColumnBuilder;
}());
export { RelationJoinColumnBuilder };

//# sourceMappingURL=RelationJoinColumnBuilder.js.map
