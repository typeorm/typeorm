import { Connection, EntitySchema, ObjectType } from '@typeorm/core';
import { MongoRepository } from './MongoRepository';
import { MongoEntityManager } from './MongoEntityManager';

export class MongoConnection extends Connection {
    readonly manager: MongoEntityManager;

    getRepository<Entity>(target: ObjectType<Entity> | EntitySchema<Entity> | string): MongoRepository<Entity> {
        return super.getRepository(target) as MongoRepository<Entity>;
    }
}
