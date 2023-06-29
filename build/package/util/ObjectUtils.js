"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectUtils = void 0;
class ObjectUtils {
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param sources One or more source objects from which to copy properties
     */
    static assign(target, ...sources) {
        for (const source of sources) {
            for (const prop of Object.getOwnPropertyNames(source)) {
                target[prop] = source[prop];
            }
        }
    }
}
exports.ObjectUtils = ObjectUtils;

//# sourceMappingURL=ObjectUtils.js.map
