import {Subject} from "../Subject";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {OrmUtils} from "../../util/OrmUtils";

/**
 * Executes subject operations for nested set tree entities.
 */
export class NestedSetSubjectExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes operations when subject is being inserted.
     */
    async insert(subject: Subject): Promise<void> {
        const escape = (alias: string) => this.queryRunner.connection.driver.escape(alias);
        const tableName = this.getTableName(subject.metadata.tablePath);
        const leftColumnName = escape(subject.metadata.nestedSetLeftColumn!.databaseName);
        const rightColumnName = escape(subject.metadata.nestedSetRightColumn!.databaseName);

        let parent = subject.metadata.treeParentRelation!.getEntityValue(subject.entity!); // if entity was attached via parent
        if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
            parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;
        const parentId = subject.metadata.getEntityIdMap(parent);

        let parentNsRight: number|undefined = undefined;
        if (parentId) {
            parentNsRight = await this.queryRunner.manager
                .createQueryBuilder()
                .select(subject.metadata.targetName + "." + subject.metadata.nestedSetRightColumn!.propertyPath, "right")
                .from(subject.metadata.target, subject.metadata.targetName)
                .whereInIds(parentId)
                .getRawOne()
                .then(result => {
                    const value: any = result ? result["right"] : undefined;
                    // CockroachDB returns numeric types as string
                    return typeof value === "string" ? parseInt(value) : value;
                });
        }

        if (parentNsRight !== undefined) {
            await this.queryRunner.query(`UPDATE ${tableName} SET ` +
                `${leftColumnName} = CASE WHEN ${leftColumnName} > ${parentNsRight} THEN ${leftColumnName} + 2 ELSE ${leftColumnName} END,` +
                `${rightColumnName} = ${rightColumnName} + 2 ` +
                `WHERE ${rightColumnName} >= ${parentNsRight}`);

            OrmUtils.mergeDeep(
                subject.insertedValueSet,
                subject.metadata.nestedSetLeftColumn!.createValueMap(parentNsRight),
                subject.metadata.nestedSetRightColumn!.createValueMap(parentNsRight + 1),
            );
        } else {
            OrmUtils.mergeDeep(
                subject.insertedValueSet,
                subject.metadata.nestedSetLeftColumn!.createValueMap(1),
                subject.metadata.nestedSetRightColumn!.createValueMap(2),
            );
        }
    }

    /**
     * Gets escaped table name with schema name if SqlServer or Postgres driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    protected getTableName(tablePath: string): string {
        return tablePath.split(".")
            .map(i => {
                // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
                if (i === "")
                    return i;
                return this.queryRunner.connection.driver.escape(i);
            }).join(".");
    }

}
