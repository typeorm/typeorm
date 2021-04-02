/**
 * Broadcaster execution result - promises executed by operations and number of executed listeners and subscribers.
 */
var BroadcasterResult = /** @class */ (function () {
    function BroadcasterResult() {
        /**
         * Number of executed listeners and subscribers.
         */
        this.count = 0;
        /**
         * Promises returned by listeners and subscribers which needs to be awaited.
         */
        this.promises = [];
    }
    return BroadcasterResult;
}());
export { BroadcasterResult };

//# sourceMappingURL=BroadcasterResult.js.map
