"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = void 0;
const __1 = require("../../");
/**
 * Injects transaction's entity manager into the method wrapped with @Transaction decorator.
 */
function TransactionManager() {
    return function (object, methodName, index) {
        (0, __1.getMetadataArgsStorage)().transactionEntityManagers.push({
            target: object.constructor,
            methodName: methodName,
            index: index,
        });
    };
}
exports.TransactionManager = TransactionManager;

//# sourceMappingURL=TransactionManager.js.map
