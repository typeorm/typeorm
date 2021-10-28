import { EntitySubscriberInterface, EventSubscriber, LoadEvent, UpdateEvent } from "../../../../src";
import {Setting} from "./Setting";

function newCounter() {
	return {
		deletes:0,
		inserts:0,
		updates:0,
	};
}

@EventSubscriber()
export class SettingSubscriber implements EntitySubscriberInterface {
    counter = newCounter();

	listenTo() {
		return Setting;
	}

	afterLoad(item: Setting, event?: LoadEvent<Setting>) {
		// just an example, any entity modification on after load will lead to this issue
		item.value = "x";
	}

    beforeUpdate(event: UpdateEvent<any>): void {
        this.counter.updates++;
    }

    beforeInsert(event: UpdateEvent<any>): void {
        this.counter.inserts++;
    }

    beforeRemove(event: UpdateEvent<any>): void {
        this.counter.deletes++;
    }

	reset() {
		this.counter = newCounter();
	}
}
