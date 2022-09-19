import { SqlInMemory } from "../../driver/SqlInMemory"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { RdbmsSchemaBuilder } from "../RdbmsSchemaBuilder"

/**
 * This interface provides basic ability to create custom migration hooks for relational databases
 */
export interface RdbmsSchemaBuilderHook {
    /**
     * This method will be called after migrations table is created, but before any other action.
     * This is your last moment to actually query database
     * If you expect live-update synchronization, you should associate data with schemaBuilder using `WeakMap`
     */
    init?(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadata: EntityMetadata[],
    ): Promise<void>

    /**
     * It's important to remember that provided `QueryRunner` may be in special in-memory mode. It means that
     * all executed queries won't be immediately executed, but they will be saved in the memory.
     */
    afterAll?(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadata: EntityMetadata[],
    ): Promise<SqlInMemory>

    /**
     * It's important to remember that provided `QueryRunner` is in special in-memory mode. It means that
     * all executed queries won't be immediately executed, but they will be saved in the memory.
     */

    beforeAll?(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadata: EntityMetadata[],
    ): Promise<SqlInMemory>
}
