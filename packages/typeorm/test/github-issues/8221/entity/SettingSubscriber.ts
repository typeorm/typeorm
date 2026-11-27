import { EntitySubscriberInterface, EventSubscriber } from "../../../../src"
import { Setting } from "./Setting"

@EventSubscriber()
export class SettingSubscriber implements EntitySubscriberInterface {
    counter: {
        deletes: number
        inserts: number
        updates: number
    }

    constructor() {
        this.reset()
    }

    listenTo() {
        return Setting
    }

    afterLoad(item: Setting) {
        // just an example, any entity modification on after load will lead to this issue
        item.value = "x"
    }

    beforeUpdate(): void {
        this.counter.updates++
    }

    beforeInsert(): void {
        this.counter.inserts++
    }

    beforeRemove(): void {
        this.counter.deletes++
    }

    reset() {
        this.counter = {
            deletes: 0,
            inserts: 0,
            updates: 0,
        }
    }
}
