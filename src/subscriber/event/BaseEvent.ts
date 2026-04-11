import type { EntityManager } from "../../entity-manager/EntityManager"
import type { DataSource } from "../../data-source/DataSource"
import type { QueryRunner } from "../../query-runner/QueryRunner"

/**
 * BaseEvent represents the base class for all events that broadcaster sends to the entity subscriber when an event occurs.
 */
export interface BaseEvent {
    /**
     * DataSource used in the event.
     */
    dataSource: DataSource

    /**
     * DataSource used in the event.
     *
     * @deprecated since 1.0.0. Use {@link dataSource} instance instead.
     */
    connection: DataSource

    /**
     * QueryRunner used in the event transaction.
     * All database operations in the subscribed event listener should be performed using this query runner instance.
     */
    queryRunner: QueryRunner

    /**
     * EntityManager used in the event transaction.
     * All database operations in the subscribed event listener should be performed using this entity manager instance.
     */
    manager: EntityManager
}
