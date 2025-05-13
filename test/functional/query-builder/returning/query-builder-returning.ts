import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

import { User } from "./entity/User"

describe("query builder > insert/update/delete returning", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mssql", "postgres", "spanner"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create and perform an INSERT statement, including RETURNING or OUTPUT clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Tim Merrison"

                const qb = connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user)
                    .returning(
                        connection.driver.options.type === "mssql"
                            ? "inserted.*"
                            : "*",
                    )

                const sql = qb.getSql()
                if (connection.driver.options.type === "mssql") {
                    expect(sql).to.equal(
                        `INSERT INTO "user"("name") OUTPUT inserted.* VALUES (@0)`,
                    )
                } else if (connection.driver.options.type === "postgres") {
                    expect(sql).to.equal(
                        `INSERT INTO "user"("name") VALUES ($1) RETURNING *`,
                    )
                } else if (connection.driver.options.type === "spanner") {
                    expect(sql).to.equal(
                        "INSERT INTO `user`(`name`) VALUES ($1) THEN RETURN *",
                    )
                }

                const returning = await qb.execute()
                expect(returning.raw).to.deep.equal([
                    { id: 1, name: user.name },
                ])
            }),
        ))

    it("should create and perform an UPDATE statement, including RETURNING or OUTPUT clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Tim Merrison"

                await connection.manager.save(user)

                const qb = connection
                    .createQueryBuilder()
                    .update(User)
                    .set({ name: "Joe Bloggs" })
                    .where("name = :name", { name: user.name })
                    .returning(
                        connection.driver.options.type === "mssql"
                            ? "inserted.*"
                            : "*",
                    )

                const sql = qb.getSql()

                if (connection.driver.options.type === "mssql") {
                    expect(sql).to.equal(
                        `UPDATE "user" SET "name" = @0 OUTPUT inserted.* WHERE "name" = @1`,
                    )
                } else if (connection.driver.options.type === "postgres") {
                    expect(sql).to.equal(
                        `UPDATE "user" SET "name" = $1 WHERE "name" = $2 RETURNING *`,
                    )
                } else if (connection.driver.options.type === "spanner") {
                    expect(sql).to.equal(
                        "UPDATE `user` SET `name` = $1 WHERE `name` = $2 THEN RETURN *",
                    )
                }

                const returning = await qb.execute()
                expect(returning.raw).to.deep.equal([
                    { id: 1, name: "Joe Bloggs" },
                ])
            }),
        ))

    it("should create and perform a DELETE statement, including RETURNING or OUTPUT clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Tim Merrison"

                await connection.manager.save(user)

                const qb = connection
                    .createQueryBuilder()
                    .delete()
                    .from(User)
                    .where("name = :name", { name: user.name })
                    .returning(
                        connection.driver.options.type === "mssql"
                            ? "deleted.*"
                            : "*",
                    )

                const sql = qb.getSql()

                if (connection.driver.options.type === "mssql") {
                    expect(sql).to.equal(
                        `DELETE FROM "user" OUTPUT deleted.* WHERE "name" = @0`,
                    )
                } else if (connection.driver.options.type === "postgres") {
                    expect(sql).to.equal(
                        `DELETE FROM "user" WHERE "name" = $1 RETURNING *`,
                    )
                } else if (connection.driver.options.type === "spanner") {
                    expect(sql).to.equal(
                        "DELETE FROM `user` WHERE `name` = $1 THEN RETURN *",
                    )
                }

                const returning = await qb.execute()
                expect(returning.raw).to.deep.equal([
                    { id: 1, name: user.name },
                ])
            }),
        ))
})
