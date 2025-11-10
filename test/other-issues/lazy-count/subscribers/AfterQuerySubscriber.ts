import {
    AfterQueryEvent,
    EntitySubscriberInterface,
    EventSubscriber,
} from "../../../../src"

@EventSubscriber()
export class AfterQuerySubscriber implements EntitySubscriberInterface {
    private calledQueries: any[] = []

    afterQuery(event: AfterQueryEvent) {
        this.calledQueries.push(event.query)
    }

    getCalledQueries() {
        return this.calledQueries
    }

    clear() {
        this.calledQueries = []
    }
}
