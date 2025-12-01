import "reflect-metadata"
import { expect } from "chai"

import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { Company } from "./entity/Company"
import { Office } from "./entity/Office"
import { User } from "./entity/User"

describe("deferrable foreign key constraint", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3", "postgres", "sap", "sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("initially deferred fk should be validated at the end of transaction", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.transaction(async (entityManager) => {
                    // first save user
                    const user = new User()
                    user.id = 1
                    user.company = { id: 100 }
                    user.name = "Bob"

                    await entityManager.save(user)

                    // then save company
                    const company = new Company()
                    company.id = 100
                    company.name = "Acme"

                    await entityManager.save(company)
                }).should.not.be.rejected

                // now check
                const user = await connection.manager.findOne(User, {
                    relations: { company: true },
                    where: { id: 1 },
                })

                expect(user).to.deep.equal({
                    id: 1,
                    name: "Bob",
                    company: {
                        id: 100,
                        name: "Acme",
                    },
                })
            }),
        ))

    it("initially immediate fk should be validated at the end at transaction with deferred check time", () =>
        Promise.all(
            connections.map(async (connection) => {
                // changing the constraint check time is only supported on postgres
                if (connection.driver.options.type !== "postgres") return

                await connection.manager.transaction(async (entityManager) => {
                    // first set constraints deferred manually
                    await entityManager.query("SET CONSTRAINTS ALL DEFERRED")

                    // now save office
                    const office = new Office()
                    office.id = 2
                    office.company = { id: 200 }
                    office.name = "Barcelona"

                    await entityManager.save(office)

                    // then save company
                    const company = new Company()
                    company.id = 200
                    company.name = "Emca"

                    await entityManager.save(company)
                }).should.not.be.rejected

                // now check
                const office = await connection.manager.findOne(Office, {
                    relations: { company: true },
                    where: { id: 2 },
                })

                expect(office).to.deep.equal({
                    id: 2,
                    name: "Barcelona",
                    company: {
                        id: 200,
                        name: "Emca",
                    },
                })
            }),
        ))
})
