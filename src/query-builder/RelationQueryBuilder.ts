import {QueryBuilder} from "./QueryBuilder";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 *
 * todo: implement all functions using SpecificRepository code.
 */
export class RelationQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        return "";
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets entity relation's value.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Works only for many-to-one and one-to-one relations.
     * For many-to-many and one-to-many relations use #add and #remove methods instead.
     */
    set(value: any): this {

        return this;
    }

    /**
     * Adds (binds) given value to entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    add(value: any|any[]): this {

        return this;
    }

    /**
     * Removes (unbinds) given value from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    remove(value: any|any[]): this {

        return this;
    }

    /**
     * Gets entity's relation id.
     */
    async getIdOf(): Promise<any> {

    }

    /**
     * Gets entity's relation ids.
     */
    async getIdsOf(): Promise<any[]> {
        return [];
    }

}


/**
 * Repository for more specific operations.
 *
 * @deprecated Don't use it yet
 *
 * todo: most of these methods looks like can be part of query builder functionality
 * todo: maybe instead of SpecificRepository we should have SpecificQueryBuilder? (better name needed)
 * todo: it can be used like createQueryBuilder().specific().setRelation
 * todo: or maybe split specific into multiple different purpose QueryBuilders ? For example RelationQueryBuilder
 * todo: with methods like createQueryBuilder().relation(Post, "categories").set(value).add(value).remove(value)
 * todo: add and remove for many-to-many, set for many-to-one and value can be entity or simply entity id or id map
 * todo: also createQueryBuilder().relation(Post, "categories").getIdsOf(postIds)
 * todo: also createQueryBuilder().relation(Post, "categories").getCountOf(postIds)
 */
/*export class SpecificRepository<Entity extends ObjectLiteral> {

 // -------------------------------------------------------------------------
 // Constructor
 // -------------------------------------------------------------------------

 constructor(protected connection: Connection,
 protected metadata: EntityMetadata,
 protected queryRunner?: QueryRunner) {
 }

 // -------------------------------------------------------------------------
 // Public Methods
 // -------------------------------------------------------------------------
 */
/**
 * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
 * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async setRelation(relationName: string, entityId: any, relatedEntityId: any): Promise<void>;

/**
 * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
 * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async setRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void>;

/**
 * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
 * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async setRelation(relationProperty: string|((t: Entity) => string|any), entityId: any, relatedEntityId: any): Promise<void> {
        const propertyPath = this.metadata.computePropertyPath(relationProperty);
        const relation = this.metadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in entity was not found.`);
        // if (relation.isManyToMany || relation.isOneToMany || relation.isOneToOneNotOwner)
        //     throw new Error(`Only many-to-one and one-to-one with join column are supported for this operation. ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);
        if (relation.isManyToMany)
            throw new Error(`Many-to-many relation is not supported for this operation. Use #addToRelation method for many-to-many relations.`);

        // todo: fix issues with joinColumns[0]

        let table: string, values: any = {}, conditions: any = {};
        if (relation.isOwning) {
            table = relation.entityMetadata.tableName;
            values[relation.joinColumns[0].referencedColumn!.databaseName] = relatedEntityId;
            conditions[relation.joinColumns[0].referencedColumn!.databaseName] = entityId;
        } else {
            table = relation.inverseEntityMetadata.tableName;
            values[relation.inverseRelation!.joinColumns[0].referencedColumn!.databaseName] = relatedEntityId;
            conditions[relation.inverseRelation!.joinColumns[0].referencedColumn!.databaseName] = entityId;
        }


        const usedQueryRunner = this.queryRunner || this.connection.createQueryRunner();
        await usedQueryRunner.update(table, values, conditions);
        if (!this.queryRunner) // means created by this method
            await usedQueryRunner.release();
    }*/

/**
 * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
 * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async setInverseRelation(relationName: string, relatedEntityId: any, entityId: any): Promise<void>;

/**
 * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
 * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async setInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityId: any): Promise<void>;

/**
 * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
 * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async setInverseRelation(relationProperty: string|((t: Entity) => string|any), relatedEntityId: any, entityId: any): Promise<void> {
        const propertyPath = this.metadata.computePropertyPath(relationProperty);
        // todo: fix issues with joinColumns[0]
        const relation = this.metadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in entity was not found.`);
        // if (relation.isManyToMany || relation.isOneToMany || relation.isOneToOneNotOwner)
        //     throw new Error(`Only many-to-one and one-to-one with join column are supported for this operation. ${this.metadata.name}#${propertyName} relation type is ${relation.relationType}`);
        if (relation.isManyToMany)
            throw new Error(`Many-to-many relation is not supported for this operation. Use #addToRelation method for many-to-many relations.`);

        let table: string, values: any = {}, conditions: any = {};
        if (relation.isOwning) {
            table = relation.inverseEntityMetadata.tableName;
            values[relation.inverseRelation!.joinColumns[0].databaseName] = relatedEntityId;
            conditions[relation.inverseRelation!.joinColumns[0].referencedColumn!.databaseName] = entityId;
        } else {
            table = relation.entityMetadata.tableName;
            values[relation.joinColumns[0].databaseName] = relatedEntityId;
            conditions[relation.joinColumns[0].referencedColumn!.databaseName] = entityId;
        }

        const usedQueryRunner = this.queryRunner || this.connection.createQueryRunner();
        await usedQueryRunner.update(table, values, conditions);
        if (!this.queryRunner) // means created by this method
            await usedQueryRunner.release();
    }*/

/**
 * Adds a new relation between two entities into relation's many-to-many table.
 * Should be used when you want quickly and efficiently add a relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addToRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;

/**
 * Adds a new relation between two entities into relation's many-to-many table.
 * Should be used when you want quickly and efficiently add a relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addToRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;

/**
 * Adds a new relation between two entities into relation's many-to-many table.
 * Should be used when you want quickly and efficiently add a relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async addToRelation(relationProperty: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        const propertyPath = this.metadata.computePropertyPath(relationProperty);
        const relation = this.metadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in entity was not found.`);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyPath} relation type is ${relation.relationType}`);

        const usedQueryRunner = this.queryRunner || this.connection.createQueryRunner();
        const insertPromises = relatedEntityIds.map(relatedEntityId => {
            const values: any = {};
            if (relation.isOwning) {
                values[relation.junctionEntityMetadata!.columns[0].databaseName] = entityId;
                values[relation.junctionEntityMetadata!.columns[1].databaseName] = relatedEntityId;
            } else {
                values[relation.junctionEntityMetadata!.columns[1].databaseName] = entityId;
                values[relation.junctionEntityMetadata!.columns[0].databaseName] = relatedEntityId;
            }

            return usedQueryRunner.insert(relation.junctionEntityMetadata!.tableName, values);
        });
        await Promise.all(insertPromises);

        if (!this.queryRunner) // means created by this method
            await usedQueryRunner.release();
    }*/

/**
 * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
 * Should be used when you want quickly and efficiently add a relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addToInverseRelation(relationName: string, relatedEntityId: any, entityIds: any[]): Promise<void>;

/**
 * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
 * Should be used when you want quickly and efficiently add a relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addToInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void>;

/**
 * Adds a new relation between two entities into relation's many-to-many table from inverse side of the given relation.
 * Should be used when you want quickly and efficiently add a relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async addToInverseRelation(relationProperty: string|((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void> {
        const propertyPath = this.metadata.computePropertyPath(relationProperty);
        const relation = this.metadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in entity was not found.`);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyPath} relation type is ${relation.relationType}`);

        const usedQueryRunner = this.queryRunner || this.connection.createQueryRunner();
        try {
            const insertPromises = entityIds.map(entityId => {
                const values: any = {};
                if (relation.isOwning) {
                    values[relation.junctionEntityMetadata!.columns[0].databaseName] = entityId;
                    values[relation.junctionEntityMetadata!.columns[1].databaseName] = relatedEntityId;
                } else {
                    values[relation.junctionEntityMetadata!.columns[1].databaseName] = entityId;
                    values[relation.junctionEntityMetadata!.columns[0].databaseName] = relatedEntityId;
                }

                return usedQueryRunner.insert(relation.junctionEntityMetadata!.tableName, values);
            });
            await Promise.all(insertPromises);

        } finally {
            if (!this.queryRunner) // means created by this method
                await usedQueryRunner.release();
        }
    }*/

/**
 * Removes a relation between two entities from relation's many-to-many table.
 * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async removeFromRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Promise<void>;

/**
 * Removes a relation between two entities from relation's many-to-many table.
 * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async removeFromRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void>;

/**
 * Removes a relation between two entities from relation's many-to-many table.
 * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async removeFromRelation(relationProperty: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Promise<void> {
        const propertyPath = this.metadata.computePropertyPath(relationProperty);
        const relation = this.metadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in entity was not found.`);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyPath} relation type is ${relation.relationType}`);

        // check if given relation entity ids is empty - then nothing to do here (otherwise next code will remove all ids)
        if (!relatedEntityIds || !relatedEntityIds.length)
            return Promise.resolve();

        const qb = this.connection.manager
            .createQueryBuilder(this.queryRunner)
            .delete()
            .from(relation.junctionEntityMetadata!.tableName, "junctionEntity");

        const firstColumnName = this.connection.driver.escapeColumn(relation.isOwning ? relation.junctionEntityMetadata!.columns[0].databaseName : relation.junctionEntityMetadata!.columns[1].databaseName);
        const secondColumnName = this.connection.driver.escapeColumn(relation.isOwning ? relation.junctionEntityMetadata!.columns[1].databaseName : relation.junctionEntityMetadata!.columns[0].databaseName);

        relatedEntityIds.forEach((relatedEntityId, index) => {
            qb.orWhere(`(${firstColumnName}=:entityId AND ${secondColumnName}=:relatedEntity_${index})`)
                .setParameter("relatedEntity_" + index, relatedEntityId);
        });

        await qb
            .setParameter("entityId", entityId)
            .execute();
    }*/

/**
 * Removes a relation between two entities from relation's many-to-many table.
 * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async removeFromInverseRelation(relationName: string, relatedEntityId: any, entityIds: any[]): Promise<void>;

/**
 * Removes a relation between two entities from relation's many-to-many table.
 * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async removeFromInverseRelation(relationName: ((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void>;

/**
 * Removes a relation between two entities from relation's many-to-many table.
 * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async removeFromInverseRelation(relationProperty: string|((t: Entity) => string|any), relatedEntityId: any, entityIds: any[]): Promise<void> {
        const propertyPath = this.metadata.computePropertyPath(relationProperty);
        const relation = this.metadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Relation with property path ${propertyPath} in entity was not found.`);
        if (!relation.isManyToMany)
            throw new Error(`Only many-to-many relation supported for this operation. However ${this.metadata.name}#${propertyPath} relation type is ${relation.relationType}`);

        // check if given entity ids is empty - then nothing to do here (otherwise next code will remove all ids)
        if (!entityIds || !entityIds.length)
            return Promise.resolve();

        const qb = this.connection.manager
            .createQueryBuilder(this.queryRunner)
            .delete()
            .from(relation.junctionEntityMetadata!.tableName, "junctionEntity");

        const firstColumnName = relation.isOwning ? relation.junctionEntityMetadata!.columns[1].databaseName : relation.junctionEntityMetadata!.columns[0].databaseName;
        const secondColumnName = relation.isOwning ? relation.junctionEntityMetadata!.columns[0].databaseName : relation.junctionEntityMetadata!.columns[1].databaseName;

        entityIds.forEach((entityId, index) => {
            qb.orWhere(`(${firstColumnName}=:relatedEntityId AND ${secondColumnName}=:entity_${index})`)
              .setParameter("entity_" + index, entityId);
        });

        await qb.setParameter("relatedEntityId", relatedEntityId).execute();
    }*/

/**
 * Performs both #addToRelation and #removeFromRelation operations.
 * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addAndRemoveFromRelation(relation: string, entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;

/**
 * Performs both #addToRelation and #removeFromRelation operations.
 * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addAndRemoveFromRelation(relation: ((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void>;

/**
 * Performs both #addToRelation and #removeFromRelation operations.
 * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async addAndRemoveFromRelation(relation: string|((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Promise<void> {
        await Promise.all([
            this.addToRelation(relation as any, entityId, addRelatedEntityIds),
            this.removeFromRelation(relation as any, entityId, removeRelatedEntityIds)
        ]);
    }*/

/**
 * Performs both #addToRelation and #removeFromRelation operations.
 * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addAndRemoveFromInverseRelation(relation: string, relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void>;

/**
 * Performs both #addToRelation and #removeFromRelation operations.
 * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
 */
// async addAndRemoveFromInverseRelation(relation: ((t: Entity) => string|any), relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void>;

/**
 * Performs both #addToRelation and #removeFromRelation operations.
 * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
 * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.

 async addAndRemoveFromInverseRelation(relation: string|((t: Entity) => string|any), relatedEntityId: any, addEntityIds: any[], removeEntityIds: any[]): Promise<void> {
        await Promise.all([
            this.addToInverseRelation(relation as any, relatedEntityId, addEntityIds),
            this.removeFromInverseRelation(relation as any, relatedEntityId, removeEntityIds)
        ]);
    }*/

// -------------------------------------------------------------------------
// Protected Methods
// -------------------------------------------------------------------------

/**
 * Converts entity or entities to id or ids map.

 protected convertEntityOrEntitiesToIdOrIds(columns: ColumnMetadata[], entityOrEntities: Entity[]|Entity|any|any[]): any|any[] {
        if (entityOrEntities instanceof Array) {
            return entityOrEntities.map(entity => this.convertEntityOrEntitiesToIdOrIds(columns, entity));

        } else {
            if (entityOrEntities instanceof Object) {
                return columns.reduce((ids, column) => {
                    ids[column.databaseName] = column.getEntityValue(entityOrEntities);
                    return ids;
                }, {} as ObjectLiteral);
            } else {
                return entityOrEntities;
            }
        }
    }*/

/**
 * Extracts unique objects from given entity and all its downside relations.

 protected extractObjectsById(entity: any, metadata: EntityMetadata, entityWithIds: Subject[] = []): Promise<Subject[]> {
        const promises = metadata.relations.map(relation => {
            const relMetadata = relation.inverseEntityMetadata;

            const value = relation.getEntityValue(entity);
            if (!value)
                return undefined;

            if (value instanceof Array) {
                const subPromises = value.map((subEntity: any) => {
                    return this.extractObjectsById(subEntity, relMetadata, entityWithIds);
                });
                return Promise.all(subPromises);

            } else {
                return this.extractObjectsById(value, relMetadata, entityWithIds);
            }
        });

        return Promise.all<any>(promises.filter(result => !!result)).then(() => {
            if (!entityWithIds.find(entityWithId => entityWithId.entity === entity)) {
                const entityWithId = new Subject(metadata, entity);
                entityWithIds.push(entityWithId);
            }

            return entityWithIds;
        });
    }  */

// }