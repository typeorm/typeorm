import {
    EntitySubscriberInterface,
    EventSubscriber,
    UpdateEvent,
} from "../../../../src"
import { Setting } from "../entity/Setting"

@EventSubscriber()
export class MockSubscriber implements EntitySubscriberInterface {
    calledData: any[] = []

    listenTo() {
        return Setting
    }

    beforeRemove(event: UpdateEvent<any>): void {
        this.calledData.push(event.databaseEntity)
    }

    clear() {
        this.calledData = []
    }
}
