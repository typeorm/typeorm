import {
    AfterQueryEvent,
    EntitySubscriberInterface,
    EventSubscriber,
} from "../../../../../src"

@EventSubscriber()
export class QueryExecutionTimeSubscriber implements EntitySubscriberInterface {
    private executionTimes: (number | undefined)[] = []

    afterQuery(event: AfterQueryEvent): void {
        this.executionTimes.push(event.executionTime)
    }

    getExecutionTimes(): (number | undefined)[] {
        return this.executionTimes
    }

    clear(): void {
        this.executionTimes = []
    }
}
