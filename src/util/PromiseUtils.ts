/**
 * Utils to help to work with Promise objects.
 */
export class PromiseUtils {

    /**
     * Creates a new promise with resolved value used for lazy relations.
     */
    static create(value: any) {
        const promise = Promise.resolve(value);
        (promise as any)["__value__"] = value;
        return promise;
    }

    /**
     * If given value is a promise created by "create" method this method gets its value.
     * If given value is not a promise then given value is returned back.
     */
    static extractValue(object: any) {
        if (object instanceof Promise && (object as any)["__value__"])
            return (object as any)["__value__"];

        return object;
    }

    /**
     * Runs given callback that returns promise for each item in the given collection in order.
     * Operations executed after each other, right after previous promise being resolved.
     */
    static runInSequence<T, U>(collection: T[], callback: (item: T) => Promise<U>): Promise<U[]> {
        const results: U[] = [];
        return collection.reduce((promise, item) => {
            return promise.then(() => {
                return callback(item);
            }).then(result => {
                results.push(result);
            });
        }, Promise.resolve()).then(() => {
            return results;
        });
    }

    /**
     * Returns a promise that is fulfilled with an array of promise state snapshots,
     * but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     */
    static settle(promises: Promise<any>[]) {
        return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
            state: "fulfilled",
            value: v,
        }), r => ({
            state: "rejected",
            reason: r,
        })))).then((results: any[]): any => {
            const rejected = results.find(result => result.state === "rejected");
            if (rejected)
                return Promise.reject(rejected.reason);

            return results.map(result => result.value);
        });
    }

}