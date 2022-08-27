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
import { expect } from "chai"

// This is interface for pg_hooks
interface PgRule {
    schemaname: string
    tablename: string
    rulename: string
    definition: string
}

class AuditHook implements RdbmsSchemaBuilderHook {
    rulePrefix = "audit_"

    pgRules: PgRule[] = []

    public async init(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
    ): Promise<void> {
        this.pgRules = await queryRunner.query(
            `
            SELECT *
            FROM "pg_catalog"."pg_rules"
            WHERE "rulename"::text LIKE $1
        `.trim(),
            [`%${this.rulePrefix}%`],
        )
    }

    public async beforeAll(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadatas: EntityMetadata[],
    ): Promise<void> {
        for (const rule of this.pgRules) {
            if (rule.rulename.startsWith(this.rulePrefix)) {
                await queryRunner.query(
                    `DROP RULE IF EXISTS "${rule.rulename}" ON "${rule.tablename}"`,
                )
            }
        }
    }

    public async afterAll(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadatas: EntityMetadata[],
    ): Promise<void> {
        for (const entityMetadata of entityMetadatas) {
            if (entityMetadata.tableName !== "audit")
                await queryRunner.query(this.getRuleDefinition(entityMetadata))
        }
    }

    private getRuleName(entityMetadata: EntityMetadata): string {
        return `${this.rulePrefix}${entityMetadata.tableName}`
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

    it("should work in simple scenario", async () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.synchronize(true)
                const randomString = Math.random().toString()
                await connection
                    .getRepository(Post)
                    .save({ data: randomString })
                const auditResults = await connection
                    .getRepository(Audit)
                    .find()
                expect(auditResults.length).to.be.equal(1)
                expect(auditResults[0].data.data).to.be.equal(randomString)
            }),
        ))

    it("should work with double synchronization", async () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.synchronize(true)
                const randomString = Math.random().toString()
                await connection
                    .getRepository(Post)
                    .save({ data: randomString })
                await connection.synchronize()
                const auditResults = await connection
                    .getRepository(Audit)
                    .find()
                console.log(auditResults)
                expect(auditResults.length).to.be.equal(2)
                expect(auditResults[0].data.data).to.be.equal(randomString)
            }),
        ))
})
