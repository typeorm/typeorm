import { EntityPersistExecutor } from '@typeorm/core';
import { MongoSubjectExecutor } from './MongoSubjectExecutor';

export class MongoEntityPersistExecutor extends EntityPersistExecutor {

    protected subjectExecutorCls = MongoSubjectExecutor;
}
