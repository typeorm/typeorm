import {RelationIdAttribute} from "./RelationIdAttribute";
import {Connection} from "../../connection/Connection";
import {RelationIdLoadResult} from "./RelationIdLoadResult";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DriverUtils} from "../../driver/DriverUtils";
import { Or } from "../../expression-builder/expression/logical/Or";
import { And } from "../../expression-builder/expression/logical/And";
import { Equal } from "../../expression-builder/expression/comparison/Equal";
import { Col } from "../../expression-builder/expression/Column";

export class RelationIdLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunner: QueryRunner|undefined,
                protected relationIdAttributes: RelationIdAttribute[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    async load(rawEntities: any[]): Promise<RelationIdLoadResult[]> {

        const promises = this.relationIdAttributes.map(async relationIdAttr => {

            if (relationIdAttr.relation.isManyToOne || relationIdAttr.relation.isOneToOneOwner) {
                // example: Post and Tag
                // loadRelationIdAndMap("post.tagId", "post.tag")
                // we expect it to load id of tag

                if (relationIdAttr.queryBuilderFactory)
                    throw new Error("Additional condition can not be used with ManyToOne or OneToOne owner relations.");

                const duplicates: Array<string> = [];
                const results = rawEntities.map(rawEntity => {
                    const result: ObjectLiteral = {};
                    const duplicateParts: Array<string> = [];
                    relationIdAttr.relation.joinColumns.forEach(joinColumn => {
                        result[joinColumn.databaseName] = this.connection.driver.prepareOrmValue(rawEntity[DriverUtils.buildColumnAlias(this.connection.driver, relationIdAttr.parentAlias, joinColumn.databaseName)], joinColumn.referencedColumn!);
                        const duplicatePart = `${joinColumn.databaseName}:${result[joinColumn.databaseName]}`;
                        if (duplicateParts.indexOf(duplicatePart) === -1) {
                            duplicateParts.push(duplicatePart);
                        }
                    });

                    relationIdAttr.relation.entityMetadata.primaryColumns.forEach(primaryColumn => {
                        result[primaryColumn.databaseName] = this.connection.driver.prepareOrmValue(rawEntity[DriverUtils.buildColumnAlias(this.connection.driver, relationIdAttr.parentAlias, primaryColumn.databaseName)], primaryColumn);
                        const duplicatePart = `${primaryColumn.databaseName}:${result[primaryColumn.databaseName]}`;
                        if (duplicateParts.indexOf(duplicatePart) === -1) {
                            duplicateParts.push(duplicatePart);
                        }
                    });

                    duplicateParts.sort();
                    const duplicate = duplicateParts.join("::");
                    if (duplicates.indexOf(duplicate) !== -1) {
                        return null;
                    }
                    duplicates.push(duplicate);
                    return result;
                }).filter(v => v);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: results
                };

            } else if (relationIdAttr.relation.isOneToMany || relationIdAttr.relation.isOneToOneNotOwner) {
                // example: Post and Category
                // loadRelationIdAndMap("post.categoryIds", "post.categories")
                // we expect it to load array of category ids

                const relation = relationIdAttr.relation; // "post.categories"
                const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation!.joinColumns;
                const table = relation.inverseEntityMetadata.target; // category
                const tableName = relation.inverseEntityMetadata.tableName; // category
                const tableAlias = relationIdAttr.alias || tableName; // if condition (custom query builder factory) is set then relationIdAttr.alias defined

                const duplicates: Array<string> = [];
                const condition = Or(...rawEntities.map(rawEntity => {
                    const duplicateParts: Array<string> = [];
                    const queryPart = And(...joinColumns.map(joinColumn => {
                        const value = rawEntity[DriverUtils.buildColumnAlias(this.connection.driver, relationIdAttr.parentAlias, joinColumn.referencedColumn!.databaseName)];
                        const duplicatePart = `${tableAlias}:${joinColumn.propertyPath}:${value}`;
                        if (duplicateParts.indexOf(duplicatePart) !== -1) return undefined;
                        duplicateParts.push(duplicatePart);
                        return Equal(Col(tableAlias, joinColumn), value);
                    }).filter(v => v));
                    duplicateParts.sort();
                    const duplicate = duplicateParts.join("::");
                    if (duplicates.indexOf(duplicate) !== -1) return undefined;
                    duplicates.push(duplicate);
                    return queryPart;
                }).filter(v => v));

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (!condition)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                // generate query:
                // SELECT category.id, category.postId FROM category category ON category.postId = :postId
                const qb = this.connection.createQueryBuilder(this.queryRunner);

                joinColumns.forEach(joinColumn => {
                    qb.addSelect(tableAlias + "." + joinColumn.propertyPath, joinColumn.databaseName);
                });

                relation.inverseRelation!.entityMetadata.primaryColumns.forEach(primaryColumn => {
                    qb.addSelect(tableAlias + "." + primaryColumn.propertyPath, primaryColumn.databaseName);
                });

                qb.from(table, tableAlias)
                    .where(condition);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                const results = await qb.getRawMany();
                results.forEach(result => {
                    joinColumns.forEach(column => {
                        result[column.databaseName] = this.connection.driver.prepareOrmValue(result[column.databaseName], column.referencedColumn!);
                    });
                    relation.inverseRelation!.entityMetadata.primaryColumns.forEach(column => {
                        result[column.databaseName] = this.connection.driver.prepareOrmValue(result[column.databaseName], column);
                    });
                });

                return {
                    relationIdAttribute: relationIdAttr,
                    results
                };

            } else {
                // many-to-many
                // example: Post and Category
                // owner side: loadRelationIdAndMap("post.categoryIds", "post.categories")
                // inverse side: loadRelationIdAndMap("category.postIds", "category.posts")
                // we expect it to load array of post ids

                const relation = relationIdAttr.relation;
                const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation!.inverseJoinColumns;
                const inverseJoinColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation!.joinColumns;
                const junctionAlias = relationIdAttr.junctionAlias;
                const inverseSideTableName = relationIdAttr.joinInverseSideMetadata.tableName;
                const inverseSideTableAlias = relationIdAttr.alias || inverseSideTableName;
                const junctionTableName = relation.isOwning ? relation.junctionEntityMetadata!.tableName : relation.inverseRelation!.junctionEntityMetadata!.tableName;


                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (rawEntities.length === 0)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                const duplicates: Array<string> = [];
                const joinColumnConditions = rawEntities.map(rawEntity => {
                    const duplicateParts: Array<string> = [];
                    const queryPart = And(...joinColumns.map(joinColumn => {
                        const value = rawEntity[DriverUtils.buildColumnAlias(this.connection.driver, relationIdAttr.parentAlias, joinColumn.referencedColumn!.databaseName)];
                        const duplicatePart = `${junctionAlias}:${joinColumn}:${value}`;
                        if (duplicateParts.indexOf(duplicatePart) !== -1) return undefined;
                        duplicateParts.push(duplicatePart);
                        return Equal(Col(junctionAlias, joinColumn), value);
                    }).filter(s => s));
                    duplicateParts.sort();
                    const duplicate = duplicateParts.join("::");
                    if (duplicates.indexOf(duplicate) !== -1) return undefined;
                    duplicates.push(duplicate);
                    return queryPart;
                }).filter(s => s);

                const inverseJoinColumnCondition = And(...inverseJoinColumns.map(joinColumn =>
                    Equal(Col(junctionAlias, joinColumn), Col(inverseSideTableAlias, joinColumn.referencedColumn!))));

                const condition = And(inverseJoinColumnCondition, Or(...joinColumnConditions));

                const qb = this.connection.createQueryBuilder(this.queryRunner);

                inverseJoinColumns.forEach(joinColumn => {
                    qb.addSelect(junctionAlias + "." + joinColumn.propertyPath, joinColumn.databaseName)
                        .addOrderBy(junctionAlias + "." + joinColumn.propertyPath);
                });

                joinColumns.forEach(joinColumn => {
                    qb.addSelect(junctionAlias + "." + joinColumn.propertyPath, joinColumn.databaseName)
                        .addOrderBy(junctionAlias + "." + joinColumn.propertyPath);
                });

                qb.from(inverseSideTableName, inverseSideTableAlias)
                    .innerJoin(junctionTableName, junctionAlias, condition);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                const results = await qb.getRawMany();
                results.forEach(result => {
                    [...joinColumns, ...inverseJoinColumns].forEach(column => {
                        result[column.databaseName] = this.connection.driver.prepareOrmValue(result[column.databaseName], column.referencedColumn!);
                    });
                });

                return {
                    relationIdAttribute: relationIdAttr,
                    results
                };
            }
        });

        return Promise.all(promises);
    }
}
