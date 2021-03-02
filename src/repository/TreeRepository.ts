import {Repository} from "./Repository";
import {SelectQueryBuilder} from "../query-builder/builder/SelectQueryBuilder";
import { Col } from "../expression-builder/expression/Column";
import { Equal } from "../expression-builder/expression/comparison/Equal";
import { And } from "../expression-builder/expression/logical/And";
import { Between } from "../expression-builder/expression/comparison/Between";
import { Like } from "../expression-builder/expression/comparison/Like";
import { Concat } from "../expression-builder/expression/string/Concat";
import { SubQuery } from "../expression-builder/expression/SubQuery";

/**
 * Repository with additional functions to work with trees.
 *
 * @see Repository
 */
export class TreeRepository<Entity> extends Repository<Entity> {

    // todo: implement moving
    // todo: implement removing

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets complete trees for all roots in the table.
     */
    async findTrees(): Promise<Entity[]> {
        const roots = await this.findRoots();
        await Promise.all(roots.map(root => this.findDescendantsTree(root)));
        return roots;
    }

    /**
     * Roots are entities that have no ancestors. Finds them all.
     */
    findRoots(): Promise<Entity[]> {
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);
        const parentPropertyName = this.manager.connection.namingStrategy.joinColumnName(
          this.metadata.treeParentRelation!.propertyName, this.metadata.primaryColumns[0].propertyName
        );

        return this.createQueryBuilder("treeEntity")
            .where(`${escapeAlias("treeEntity")}.${escapeColumn(parentPropertyName)} IS NULL`)
            .getMany();
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     */
    findDescendants(entity: Entity): Promise<Entity[]> {
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getMany();
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     */
    findDescendantsTree(entity: Entity): Promise<Entity> {
        // todo: throw exception if there is no column of this relation?
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getRawAndEntities()
            .then(entitiesAndScalars => {
                const relationMaps = this.createRelationMaps("treeEntity", entitiesAndScalars.raw);
                this.buildChildrenEntityTree(entity, entitiesAndScalars.entities, relationMaps);
                return entity;
            });
    }

    /**
     * Gets number of descendants of the entity.
     */
    countDescendants(entity: Entity): Promise<number> {
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getCount();
    }

    /**
     * Creates a query builder used to get descendants of the entities in a tree.
     */
    createDescendantsQueryBuilder(alias: string, closureTableAlias: string, entity: Entity): SelectQueryBuilder<Entity> {
        if (this.metadata.treeType === "closure-table") {

            const joinCondition = And(...this.metadata.closureJunctionTable.descendantColumns
                .map(column => Equal(Col(closureTableAlias, column), Col(alias, column.referencedColumn!))));

            const whereCondition = And(...this.metadata.closureJunctionTable.ancestorColumns.map(column =>
                Equal(Col(closureTableAlias, column), column.referencedColumn!.getEntityValue(entity))));

            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.closureJunctionTable.tableName, closureTableAlias, joinCondition)
                .where(whereCondition);

        } else if (this.metadata.treeType === "nested-set") {

            const joinCondition = Between(
                Col(alias, this.metadata.nestedSetLeftColumn!),
                Col("joined", this.metadata.nestedSetLeftColumn!),
                Col("joined", this.metadata.nestedSetRightColumn!)
            );

            const whereCondition = And(...this.metadata.treeParentRelation!.joinColumns.map(joinColumn =>
                Equal(Col("joined", joinColumn.referencedColumn!), joinColumn.referencedColumn!.getEntityValue(entity))));

            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.targetName, "joined", joinCondition)
                .where(whereCondition);

        } else if (this.metadata.treeType === "materialized-path") {

            const whereCondition = Like(
                Col(alias, this.metadata.materializedPathColumn!),
                Concat(
                    SubQuery(qb =>
                        qb.select(`${this.metadata.targetName}.${this.metadata.materializedPathColumn!.propertyPath}`, "path")
                            .from(this.metadata.target, this.metadata.targetName)
                            .whereInIds(this.metadata.getEntityIdMap(entity))
                    ),
                    "%"
                )
            );

            return this
                .createQueryBuilder(alias)
                .where(whereCondition);
        }

        throw new Error(`Supported only in tree entities`);
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     */
    findAncestors(entity: Entity): Promise<Entity[]> {
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getMany();
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them in a tree - nested into each other.
     */
    findAncestorsTree(entity: Entity): Promise<Entity> {
        // todo: throw exception if there is no column of this relation?
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getRawAndEntities()
            .then(entitiesAndScalars => {
                const relationMaps = this.createRelationMaps("treeEntity", entitiesAndScalars.raw);
                this.buildParentEntityTree(entity, entitiesAndScalars.entities, relationMaps);
                return entity;
            });
    }

    /**
     * Gets number of ancestors of the entity.
     */
    countAncestors(entity: Entity): Promise<number> {
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getCount();
    }

    /**
     * Creates a query builder used to get ancestors of the entities in the tree.
     */
    createAncestorsQueryBuilder(alias: string, closureTableAlias: string, entity: Entity): SelectQueryBuilder<Entity> {
        if (this.metadata.treeType === "closure-table") {
            const joinCondition = And(...this.metadata.closureJunctionTable.ancestorColumns.map(column =>
                Equal(Col(closureTableAlias, column), Col(alias, column.referencedColumn!))));

            const whereCondition = And(...this.metadata.closureJunctionTable.descendantColumns.map(column =>
                Equal(Col(closureTableAlias, column), column.referencedColumn!.getEntityValue(entity))));

            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.closureJunctionTable.tableName, closureTableAlias, joinCondition)
                .where(whereCondition);

        } else if (this.metadata.treeType === "nested-set") {
            const joinCondition = Between(
                Col("joined", this.metadata.nestedSetLeftColumn!),
                Col(alias, this.metadata.nestedSetLeftColumn!),
                Col(alias, this.metadata.nestedSetRightColumn!)
            );

            const whereCondition = And(...this.metadata.treeParentRelation!.joinColumns.map(joinColumn =>
                Equal(Col("joined", joinColumn.referencedColumn!), joinColumn.referencedColumn!.getEntityValue(entity))));

            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.targetName, "joined", joinCondition)
                .where(whereCondition);

        } else if (this.metadata.treeType === "materialized-path") {
            // example: SELECT * FROM category category WHERE (SELECT mpath FROM `category` WHERE id = 2) LIKE CONCAT(category.mpath, '%');
            const whereCondition = Like(
                SubQuery(qb =>
                    qb.select(`${this.metadata.targetName}.${this.metadata.materializedPathColumn!.propertyPath}`, "path")
                        .from(this.metadata.target, this.metadata.targetName)
                        .whereInIds(this.metadata.getEntityIdMap(entity))
                ),
                Concat(
                    Col(alias, this.metadata.materializedPathColumn!),
                    "%"
                )
            );

            return this
                .createQueryBuilder(alias)
                .where(whereCondition);
        }

        throw new Error(`Supported only in tree entities`);
    }

    /**
     * Moves entity to the children of then given entity.
     *
    move(entity: Entity, to: Entity): Promise<void> {
        return Promise.resolve();
    } */

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createRelationMaps(alias: string, rawResults: any[]): { id: any, parentId: any }[] {
        return rawResults.map(rawResult => {
            const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
            // fixes issue #2518, default to databaseName property when givenDatabaseName is not set
            const joinColumnName = joinColumn.givenDatabaseName || joinColumn.databaseName;
            const id = rawResult[alias + "_" + this.metadata.primaryColumns[0].databaseName];
            const parentId = rawResult[alias + "_" + joinColumnName];
            return {
                id: this.manager.connection.driver.prepareOrmValue(id, this.metadata.primaryColumns[0]),
                parentId: this.manager.connection.driver.prepareOrmValue(parentId, joinColumn),
            };
        });
    }

    protected buildChildrenEntityTree(entity: any, entities: any[], relationMaps: { id: any, parentId: any }[]): void {
        const childProperty = this.metadata.treeChildrenRelation!.propertyName;
        const parentEntityId = this.metadata.primaryColumns[0].getEntityValue(entity);
        const childRelationMaps = relationMaps.filter(relationMap => relationMap.parentId === parentEntityId);
        const childIds = new Set(childRelationMaps.map(relationMap => relationMap.id));
        entity[childProperty] = entities.filter(entity => childIds.has(this.metadata.primaryColumns[0].getEntityValue(entity)));
        entity[childProperty].forEach((childEntity: any) => {
            this.buildChildrenEntityTree(childEntity, entities, relationMaps);
        });
    }

    protected buildParentEntityTree(entity: any, entities: any[], relationMaps: { id: any, parentId: any }[]): void {
        const parentProperty = this.metadata.treeParentRelation!.propertyName;
        const entityId = this.metadata.primaryColumns[0].getEntityValue(entity);
        const parentRelationMap = relationMaps.find(relationMap => relationMap.id === entityId);
        const parentEntity = entities.find(entity => {
            if (!parentRelationMap)
                return false;

            return this.metadata.primaryColumns[0].getEntityValue(entity) === parentRelationMap.parentId;
        });
        if (parentEntity) {
            entity[parentProperty] = parentEntity;
            this.buildParentEntityTree(entity[parentProperty], entities, relationMaps);
        }
    }

}
