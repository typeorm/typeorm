import { TransactionOptions } from "../options/TransactionOptions";
/**
 * Wraps some method into the transaction.
 *
 * Method result will return a promise if this decorator applied.
 * All database operations in the wrapped method should be executed using entity managed passed
 * as a first parameter into the wrapped method.
 *
 * If you want to control at what position in your method parameters entity manager should be injected,
 * then use @TransactionEntityManager() decorator.
 *
 * If you want to use repositories instead of bare entity manager,
 * then use @TransactionRepository() decorator.
 */
export declare function Transaction(connectionName?: string): MethodDecorator;
export declare function Transaction(options?: TransactionOptions): MethodDecorator;
