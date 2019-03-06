/**
 * Provides common functions for managing collections
 */
export class CollectionUtils {
    /**
     * Returns a dictionary of array values, indexed by property defind by `key`.
     */
    static indexBy<T>(list: T[], key: keyof T): Record<string, T> {
        return list.reduce((obj, item) => {
            const id = item[key] as any;
            if (obj.hasOwnProperty(id)) {
                throw new Error(`Key "${id}" is not unique!`);
            }
            obj[id] = item;
            return obj;
        }, {} as Record<string, T>);
    }
}
