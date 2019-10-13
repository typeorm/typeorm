"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utils to help to work with Promise objects.
 */
var PromiseUtils = /** @class */ (function () {
    function PromiseUtils() {
    }
    /**
     * Creates a new promise with resolved value used for lazy relations.
     */
    PromiseUtils.create = function (value) {
        var promise = Promise.resolve(value);
        promise["__value__"] = value;
        return promise;
    };
    /**
     * If given value is a promise created by "create" method this method gets its value.
     * If given value is not a promise then given value is returned back.
     */
    PromiseUtils.extractValue = function (object) {
        if (object instanceof Promise && object["__value__"])
            return object["__value__"];
        return object;
    };
    /**
     * Runs given callback that returns promise for each item in the given collection in order.
     * Operations executed after each other, right after previous promise being resolved.
     */
    PromiseUtils.runInSequence = function (collection, callback) {
        var results = [];
        return collection.reduce(function (promise, item) {
            return promise.then(function () {
                return callback(item);
            }).then(function (result) {
                results.push(result);
            });
        }, Promise.resolve()).then(function () {
            return results;
        });
    };
    /**
     * Returns a promise that is fulfilled with an array of promise state snapshots,
     * but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     */
    PromiseUtils.settle = function (promises) {
        return Promise.all(promises.map(function (p) { return Promise.resolve(p).then(function (v) { return ({
            state: "fulfilled",
            value: v,
        }); }, function (r) { return ({
            state: "rejected",
            reason: r,
        }); }); })).then(function (results) {
            var rejected = results.find(function (result) { return result.state === "rejected"; });
            if (rejected)
                return Promise.reject(rejected.reason);
            return results.map(function (result) { return result.value; });
        });
    };
    return PromiseUtils;
}());
exports.PromiseUtils = PromiseUtils;
//# sourceMappingURL=PromiseUtils.js.map