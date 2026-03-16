/**
 * Metadata args utility functions.
 */
export class MetadataUtils {
    /**
     * Gets given's entity all inherited classes.
     * Gives in order from parents to children.
     * For example Post extends ContentModel which extends Unit it will give
     * [Unit, ContentModel, Post]
     * @param entity
     */
    static getInheritanceTree(entity: Function): Function[] {
        const tree: Function[] = [entity]
        const getPrototypeOf = (object: Function): void => {
            const proto = Object.getPrototypeOf(object)
            if (proto && proto.name) {
                tree.push(proto)
                getPrototypeOf(proto)
            }
        }
        getPrototypeOf(entity)
        return tree
    }

    /**
     * Checks if this table is inherited from another table.
     * @param target1
     * @param target2
     */
    static isInherited(target1: Function, target2: Function) {
        return target1.prototype instanceof target2
    }

    /**
     * Filters given array of targets by a given classes.
     * If classes are not given, then it returns array itself.
     * @param array
     * @param classes
     */
    static filterByTarget<T extends { target?: any }>(
        array: T[],
        classes?: any[],
    ): T[] {
        if (!classes) return array
        return array.filter(
            (item) => item.target && classes.indexOf(item.target) !== -1,
        )
    }
}
