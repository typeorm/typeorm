import {
    AfterQueryEvent,
    EntitySubscriberInterface,
    EventSubscriber,
} from "../../../../src"

@EventSubscriber()
export class AfterQuerySubscriber implements EntitySubscriberInterface {
    private calledQueries: string[] = []

    afterQuery(event: AfterQueryEvent): void {
        this.calledQueries.push(event.query)
    }

    getCalledQueries(): string[] {
        return this.calledQueries
    }

    clear(): void {
        this.calledQueries = []
    }
}
