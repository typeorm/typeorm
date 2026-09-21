import {
    AfterQueryEvent,
    EntitySubscriberInterface,
    EventSubscriber,
} from "../../../../../src"

/**
 * Reports afterQuery events and, because the hook is asynchronous, whether the
 * query runner waited for it: pending is back to zero only if the runner
 * awaited the returned promise before settling the query.
 */
@EventSubscriber()
export class QueryEventSubscriber implements EntitySubscriberInterface {
    pending: number = 0
    outcomes: boolean[] = []

    async afterQuery(event: AfterQueryEvent): Promise<void> {
        this.pending++
        await new Promise((resolve) => setTimeout(resolve, 5))
        this.outcomes.push(event.success)
        this.pending--
    }

    /**
     * Only the outcomes are reset: pending is a live counter and zeroing it
     * would lose the decrement of a hook that is still running.
     */
    clearOutcomes(): void {
        this.outcomes = []
    }
}
