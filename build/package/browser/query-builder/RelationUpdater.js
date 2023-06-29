import { __awaiter } from "tslib";
import { SapDriver } from "../driver/sap/SapDriver";
import { OracleDriver } from "../driver/oracle/OracleDriver";
/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
export class RelationUpdater {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(queryBuilder, expressionMap) {
        this.queryBuilder = queryBuilder;
        this.expressionMap = expressionMap;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs set or add operation on a relation.
     */
    update(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const relation = this.expressionMap.relationMetadata;
            if (relation.isManyToOne || relation.isOneToOneOwner) {
                const updateSet = relation.joinColumns.reduce((updateSet, joinColumn) => {
                    const relationValue = value instanceof Object ? joinColumn.referencedColumn.getEntityValue(value) : value;
                    joinColumn.setEntityValue(updateSet, relationValue);
                    return updateSet;
                }, {});
                if (!this.expressionMap.of || (Array.isArray(this.expressionMap.of) && !this.expressionMap.of.length))
                    return;
                yield this.queryBuilder
                    .createQueryBuilder()
                    .update(relation.entityMetadata.target)
                    .set(updateSet)
                    .whereInIds(this.expressionMap.of)
                    .execute();
            }
            else if ((relation.isOneToOneNotOwner || relation.isOneToMany) && value === null) { // we handle null a bit different way
                const updateSet = {};
                relation.inverseRelation.joinColumns.forEach(column => {
                    updateSet[column.propertyName] = null;
                });
                const ofs = Array.isArray(this.expressionMap.of) ? this.expressionMap.of : [this.expressionMap.of];
                const parameters = {};
                const conditions = [];
                ofs.forEach((of, ofIndex) => {
                    relation.inverseRelation.joinColumns.map((column, columnIndex) => {
                        const parameterName = "joinColumn_" + ofIndex + "_" + columnIndex;
                        parameters[parameterName] = of instanceof Object ? column.referencedColumn.getEntityValue(of) : of;
                        conditions.push(`${column.propertyPath} = :${parameterName}`);
                    });
                });
                const condition = conditions.map(str => "(" + str + ")").join(" OR ");
                if (!condition)
                    return;
                yield this.queryBuilder
                    .createQueryBuilder()
                    .update(relation.inverseEntityMetadata.target)
                    .set(updateSet)
                    .where(condition)
                    .setParameters(parameters)
                    .execute();
            }
            else if (relation.isOneToOneNotOwner || relation.isOneToMany) {
                if (Array.isArray(this.expressionMap.of))
                    throw new Error(`You cannot update relations of multiple entities with the same related object. Provide a single entity into .of method.`);
                const of = this.expressionMap.of;
                const updateSet = relation.inverseRelation.joinColumns.reduce((updateSet, joinColumn) => {
                    const relationValue = of instanceof Object ? joinColumn.referencedColumn.getEntityValue(of) : of;
                    joinColumn.setEntityValue(updateSet, relationValue);
                    return updateSet;
                }, {});
                if (!value || (Array.isArray(value) && !value.length))
                    return;
                yield this.queryBuilder
                    .createQueryBuilder()
                    .update(relation.inverseEntityMetadata.target)
                    .set(updateSet)
                    .whereInIds(value)
                    .execute();
            }
            else { // many to many
                const junctionMetadata = relation.junctionEntityMetadata;
                const ofs = Array.isArray(this.expressionMap.of) ? this.expressionMap.of : [this.expressionMap.of];
                const values = Array.isArray(value) ? value : [value];
                const firstColumnValues = relation.isManyToManyOwner ? ofs : values;
                const secondColumnValues = relation.isManyToManyOwner ? values : ofs;
                const bulkInserted = [];
                firstColumnValues.forEach(firstColumnVal => {
                    secondColumnValues.forEach(secondColumnVal => {
                        const inserted = {};
                        junctionMetadata.ownerColumns.forEach(column => {
                            inserted[column.databaseName] = firstColumnVal instanceof Object ? column.referencedColumn.getEntityValue(firstColumnVal) : firstColumnVal;
                        });
                        junctionMetadata.inverseColumns.forEach(column => {
                            inserted[column.databaseName] = secondColumnVal instanceof Object ? column.referencedColumn.getEntityValue(secondColumnVal) : secondColumnVal;
                        });
                        bulkInserted.push(inserted);
                    });
                });
                if (!bulkInserted.length)
                    return;
                if (this.queryBuilder.connection.driver instanceof OracleDriver || this.queryBuilder.connection.driver instanceof SapDriver) {
                    yield Promise.all(bulkInserted.map(value => {
                        return this.queryBuilder
                            .createQueryBuilder()
                            .insert()
                            .into(junctionMetadata.tableName)
                            .values(value)
                            .execute();
                    }));
                }
                else {
                    yield this.queryBuilder
                        .createQueryBuilder()
                        .insert()
                        .into(junctionMetadata.tableName)
                        .values(bulkInserted)
                        .execute();
                }
            }
        });
    }
}

//# sourceMappingURL=RelationUpdater.js.map
