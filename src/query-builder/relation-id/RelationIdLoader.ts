import {RelationIdAttribute} from "./RelationIdAttribute";
import {Connection} from "../../connection/Connection";
import {RelationIdLoadResult} from "./RelationIdLoadResult";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunner} from "../../query-runner/QueryRunner";

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

                const results = rawEntities.map(rawEntity => {
                    const result: ObjectLiteral = {};
                    relationIdAttr.relation.joinColumns.forEach(joinColumn => {
                        result[joinColumn.databaseName] = rawEntity[relationIdAttr.parentAlias + "_" + joinColumn.databaseName];
                    });

                    relationIdAttr.relation.entityMetadata.primaryColumns.forEach(primaryColumn => {
                        result[primaryColumn.databaseName] = rawEntity[relationIdAttr.parentAlias + "_" + primaryColumn.databaseName];
                    });
                    return result;
                });

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

                const parameters: ObjectLiteral = {};
                const condition = rawEntities.map((rawEntity, index) => {
                    return joinColumns.map(joinColumn => {
                        const parameterName = joinColumn.databaseName + index;
                        parameters[parameterName] = rawEntity[relationIdAttr.parentAlias + "_" + joinColumn.referencedColumn!.databaseName];
                        return tableAlias + "." + joinColumn.propertyPath + " = :" + parameterName;
                    }).join(" AND ");
                }).map(condition => "(" + condition + ")")
                    .join(" OR ");

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
                    .where("(" + condition + ")") // need brackets because if we have additional condition and no brackets, it looks like (a = 1) OR (a = 2) AND b = 1, that is incorrect
                    .setParameters(parameters);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: await qb.getRawMany()
                };

            } else {
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
                const junctionTableName = relation.junctionEntityMetadata!.tableName;

                const mappedColumns = rawEntities.map(rawEntity => {
                    return joinColumns.reduce((map, joinColumn) => {
                        map[joinColumn.propertyPath] = rawEntity[relationIdAttr.parentAlias + "_" + joinColumn.referencedColumn!.databaseName];
                        return map;
                    }, {} as ObjectLiteral);
                });

                // ensure we won't perform redundant queries for joined data which was not found in selection
                // example: if post.category was not found in db then no need to execute query for category.imageIds
                if (mappedColumns.length === 0)
                    return { relationIdAttribute: relationIdAttr, results: [] };

                const parameters: ObjectLiteral = {};
                const joinColumnConditions = mappedColumns.map((mappedColumn, index) => {
                    return Object.keys(mappedColumn).map(key => {
                        const parameterName = key + index;
                        parameters[parameterName] = mappedColumn[key];
                        return junctionAlias + "." + key + " = :" + parameterName;
                    }).join(" AND ");
                });

                const inverseJoinColumnCondition = inverseJoinColumns.map(joinColumn => {
                    return junctionAlias + "." + joinColumn.propertyPath + " = " + inverseSideTableAlias + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                const condition = joinColumnConditions.map(condition => {
                    return "(" + condition + " AND " + inverseJoinColumnCondition + ")";
                }).join(" OR ");

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
                    .innerJoin(junctionTableName, junctionAlias, condition)
                    .setParameters(parameters);

                // apply condition (custom query builder factory)
                if (relationIdAttr.queryBuilderFactory)
                    relationIdAttr.queryBuilderFactory(qb);

                return {
                    relationIdAttribute: relationIdAttr,
                    results: await qb.getRawMany()
                };
            }
        });

        return Promise.all(promises);
    }

}