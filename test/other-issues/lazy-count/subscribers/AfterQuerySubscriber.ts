import {
    AfterQueryEvent,
    EntitySubscriberInterface,
    EventSubscriber,
} from "../../../../src"

@EventSubscriber()
export class AfterQuerySubscriber implements EntitySubscriberInterface {
    private calledQueries: any[] = []

    afterQuery(event: AfterQueryEvent<any>): void {
        this.calledQueries.push(event.query)
    }

    getCalledQueries(): any[] {
        return this.calledQueries
    }

    calls(): number {
        return this.calledQueries.length
    }

    clear(): void {
        this.calledQueries = []
    }
}
