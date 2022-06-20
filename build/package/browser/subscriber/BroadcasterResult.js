/**
 * Broadcaster execution result - promises executed by operations and number of executed listeners and subscribers.
 */
export class BroadcasterResult {
    constructor() {
        /**
         * Number of executed listeners and subscribers.
         */
        this.count = 0;
        /**
         * Promises returned by listeners and subscribers which needs to be awaited.
         */
        this.promises = [];
    }
    /**
     * Wait for all promises to settle
     */
    async wait() {
        if (this.promises.length > 0) {
            await Promise.all(this.promises);
        }
        return this;
    }
}

//# sourceMappingURL=BroadcasterResult.js.map
