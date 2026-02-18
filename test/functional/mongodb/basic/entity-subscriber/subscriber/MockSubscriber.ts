import {
    EntitySubscriberInterface,
    EventSubscriber,
    LoadEvent,
} from "../../../../../../src"
import { Example } from "../entity/Example"

@EventSubscriber()
export class MockSubscriber implements EntitySubscriberInterface<Example> {
    counter: number = 0

    listenTo(): Function | string {
        return Example
    }

    afterLoad(entity: Example, event?: LoadEvent<Example>): void {
        this.counter++
    }
}

@EventSubscriber()
export class AnotherMockSubscriber implements EntitySubscriberInterface<any> {
    counter: number = 0
    afterLoad(entity: any, event?: LoadEvent<any>): void {
        this.counter++
    }
}
