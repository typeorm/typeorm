import "reflect-metadata"

import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

import { DataSource } from "../../../src/data-source/DataSource"
import { afterEach } from "mocha"
import { expect } from "chai"
import { SchemaView1764343604699 } from "./migrations/SchemaView"

describe("github issues > #11887 drop views with no metadata.", () => {
    let connections: DataSource[]

    afterEach(async () => {
        await closeTestingConnections(connections)
    })

    it("should delete views that do not belong to the default schema", async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entities/*{.js,.ts}"],
            migrations: [__dirname + "/migrations/SchemaView{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })

        await Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const viewName = "foo_view"

                await connection.runMigrations()
                const [{ hasView }] = await queryRunner.query(
                    `SELECT COUNT(viewname) = 1 AS "hasView" FROM "pg_views" WHERE "viewname" = $1`,
                    [viewName],
                )

                expect(hasView).to.be.true

                await connection
                    .createQueryRunner()
                    .dropView(new SchemaView1764343604699().fooView)

                const [{ hasViewAfterUndo }] = await queryRunner.query(
                    `SELECT COUNT(viewname) = 1 AS "hasViewAfterUndo" FROM "pg_views" WHERE "viewname" = $1`,
                    [viewName],
                )

                expect(hasViewAfterUndo).to.be.false
            }),
        )
    })

    it("should delete views that were not created with typeorm metadata", async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entities/*{.js,.ts}"],
            migrations: [__dirname + "/migrations/MetadataView{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })

        await Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const viewName = "foo_view"
                const materializedViewName = "materialized_foo_view"

                await connection.runMigrations()
                const [{ hasView }] = await queryRunner.query(
                    `SELECT COUNT(viewname) = 1 AS "hasView" FROM "pg_views" WHERE "viewname" = $1`,
                    [viewName],
                )
                const [{ hasMaterializedView }] = await queryRunner.query(
                    `SELECT COUNT(matviewname) = 1 AS "hasMaterializedView" FROM "pg_matviews" WHERE "matviewname" = $1`,
                    [materializedViewName],
                )

                expect(hasView).to.be.true
                expect(hasMaterializedView).to.be.true

                await connection.undoLastMigration()

                const [{ hasViewAfterUndo }] = await queryRunner.query(
                    `SELECT COUNT(viewname) = 1 AS "hasViewAfterUndo" FROM "pg_views" WHERE "viewname" = $1`,
                    [viewName],
                )
                const [{ hasMaterializedViewAfterUndo }] =
                    await queryRunner.query(
                        `SELECT COUNT(matviewname) = 1 AS "hasMaterializedViewAfterUndo" FROM "pg_matviews" WHERE "matviewname" = $1`,
                        [materializedViewName],
                    )

                expect(hasViewAfterUndo).to.be.false
                expect(hasMaterializedViewAfterUndo).to.be.false
            }),
        )
    })
})
