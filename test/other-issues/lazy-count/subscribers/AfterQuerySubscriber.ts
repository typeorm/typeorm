import {
    AfterQueryEvent,
    EntitySubscriberInterface,
    EventSubscriber,
} from "../../../../src"

@EventSubscriber()
export class AfterQuerySubscriber implements EntitySubscriberInterface {
    calledQueries: any[] = []

    afterQuery(event: AfterQueryEvent<any>): void {
        this.calledQueries.push(event.query)
    }

    lastCalledQuery(): any | undefined {
        let calledQueryLength = this.calledQueries.length
        return calledQueryLength > 0
            ? this.calledQueries[calledQueryLength - 1]
            : undefined
    }

    calls(): number {
        return this.calledQueries.length
    }

    clear(): void {
        this.calledQueries = []
    }
}
