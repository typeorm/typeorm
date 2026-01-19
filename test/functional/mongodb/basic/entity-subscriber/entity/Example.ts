import {
    Column,
    Entity,
    ObjectId,
    ObjectIdColumn,
    EntitySubscriberInterface,
    EventSubscriber,
    LoadEvent,
} from "../../../../../../src"

@EventSubscriber()
export class MockSubscriber implements EntitySubscriberInterface {
    counter: number = 0
    listenTo(): Function | string {
        return Example
    }

    afterLoad(entity: Example, event?: LoadEvent<Example>): void {
        this.counter++
    }
}

@Entity()
export class Example {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    value: number = 0
}
