"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestedSetSubjectExecutor = void 0;
const tslib_1 = require("tslib");
const OrmUtils_1 = require("../../util/OrmUtils");
/**
 * Executes subject operations for nested set tree entities.
 */
class NestedSetSubjectExecutor {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(queryRunner) {
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes operations when subject is being inserted.
     */
    insert(subject) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const escape = (alias) => this.queryRunner.connection.driver.escape(alias);
            const tableName = this.getTableName(subject.metadata.tablePath);
            const leftColumnName = escape(subject.metadata.nestedSetLeftColumn.databaseName);
            const rightColumnName = escape(subject.metadata.nestedSetRightColumn.databaseName);
            let parent = subject.metadata.treeParentRelation.getEntityValue(subject.entity); // if entity was attached via parent
            if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
                parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;
            const parentId = subject.metadata.getEntityIdMap(parent);
            let parentNsRight = undefined;
            if (parentId) {
                parentNsRight = yield this.queryRunner.manager
                    .createQueryBuilder()
                    .select(subject.metadata.targetName + "." + subject.metadata.nestedSetRightColumn.propertyPath, "right")
                    .from(subject.metadata.target, subject.metadata.targetName)
                    .whereInIds(parentId)
                    .getRawOne()
                    .then(result => {
                    const value = result ? result["right"] : undefined;
                    // CockroachDB returns numeric types as string
                    return typeof value === "string" ? parseInt(value) : value;
                });
            }
            if (parentNsRight !== undefined) {
                yield this.queryRunner.query(`UPDATE ${tableName} SET ` +
                    `${leftColumnName} = CASE WHEN ${leftColumnName} > ${parentNsRight} THEN ${leftColumnName} + 2 ELSE ${leftColumnName} END,` +
                    `${rightColumnName} = ${rightColumnName} + 2 ` +
                    `WHERE ${rightColumnName} >= ${parentNsRight}`);
                OrmUtils_1.OrmUtils.mergeDeep(subject.insertedValueSet, subject.metadata.nestedSetLeftColumn.createValueMap(parentNsRight), subject.metadata.nestedSetRightColumn.createValueMap(parentNsRight + 1));
            }
            else {
                OrmUtils_1.OrmUtils.mergeDeep(subject.insertedValueSet, subject.metadata.nestedSetLeftColumn.createValueMap(1), subject.metadata.nestedSetRightColumn.createValueMap(2));
            }
        });
    }
    /**
     * Gets escaped table name with schema name if SqlServer or Postgres driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    getTableName(tablePath) {
        return tablePath.split(".")
            .map(i => {
            // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return this.queryRunner.connection.driver.escape(i);
        }).join(".");
    }
}
exports.NestedSetSubjectExecutor = NestedSetSubjectExecutor;
//# sourceMappingURL=NestedSetSubjectExecutor.js.map