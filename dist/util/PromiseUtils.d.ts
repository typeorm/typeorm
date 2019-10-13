/**
 * Utils to help to work with Promise objects.
 */
export declare class PromiseUtils {
    /**
     * Creates a new promise with resolved value used for lazy relations.
     */
    static create(value: any): Promise<any>;
    /**
     * If given value is a promise created by "create" method this method gets its value.
     * If given value is not a promise then given value is returned back.
     */
    static extractValue(object: any): any;
    /**
     * Runs given callback that returns promise for each item in the given collection in order.
     * Operations executed after each other, right after previous promise being resolved.
     */
    static runInSequence<T, U>(collection: T[], callback: (item: T) => Promise<U>): Promise<U[]>;
    /**
     * Returns a promise that is fulfilled with an array of promise state snapshots,
     * but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     */
    static settle(promises: Promise<any>[]): Promise<any>;
}
