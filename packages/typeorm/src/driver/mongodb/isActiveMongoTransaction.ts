import type { QueryRunner } from "../../query-runner/QueryRunner"

/**
 * Only ORM-owned work in an active Mongo transaction needs sequential scheduling.
 *
 * @param queryRunner
 */
export function isActiveMongoTransaction(queryRunner?: QueryRunner): boolean {
    return (
        queryRunner?.dataSource.driver.options.type === "mongodb" &&
        queryRunner.isTransactionActive
    )
}
