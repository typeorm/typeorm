import { DataSource, EntityMetadata, QueryRunner } from "../../../../../src"
import { RdbmsSchemaBuilderHook } from "../../../../../src/schema-builder/custom-hooks/RdbmsSchemaBuilderHook"
import { RdbmsSchemaBuilder } from "../../../../../src/schema-builder/RdbmsSchemaBuilder"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Audit } from "./entity/audit"
import { Post } from "./entity/post"

interface PgHook {
    schemaname: string
    tablename: string
    rulename: string
    definition: string
}

class AuditHook implements RdbmsSchemaBuilderHook {
    pgRules: PgHook[] = []

    private getRuleName(entityMetadata: EntityMetadata): string {
        return `AUDIT_${entityMetadata.tableName}`
    }

    async init(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
    ): Promise<void> {
        this.pgRules = await queryRunner.query(
            `
            SELECT *
            FROM "pg_catalog"."pg_rules"
        `.trim(),
        )
        console.log("init", await queryRunner.query(`SELECT 1`), this.pgRules)
    }

    async beforeAll(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadatas: EntityMetadata[],
    ): Promise<void> {
        for (const rule of this.pgRules) {
            if (rule.rulename.startsWith("audit_")) {
                await queryRunner.query(
                    `DROP RULE IF EXISTS "${rule.rulename}" ON "${rule.tablename}"`,
                )
            }
        }
    }

    async afterAll(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadatas: EntityMetadata[],
    ): Promise<void> {
        for (const entityMetadata of entityMetadatas) {
            if (entityMetadata.tableName !== "audit")
                await queryRunner.query(this.getRuleDefinition(entityMetadata))
        }
    }

    private getRuleDefinition(entityMetadata: EntityMetadata): string {
        return `CREATE RULE ${this.getRuleName(
            entityMetadata,
        )} AS ON INSERT TO "${entityMetadata.tableName}" DO ALSO (
            INSERT INTO "audit" ("data")
            SELECT row_to_json(NEW)
        )`
    }
}

describe("schema builder > custom hooks > Postgres rule hook", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Post, Audit],
            schemaCreate: true,
            dropSchema: true,
            schemaBuilderHooks: [new AuditHook()],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should just work", async () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.synchronize()
                await connection.getRepository(Post).save({ data: "hello" })
                console.log(await connection.query(`SELECT * FROM "audit"`))

                console.log(connection.options.schemaBuilderHooks)
            }),
        ))
})
