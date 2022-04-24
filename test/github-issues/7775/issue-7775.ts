import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Child, Parent } from "./entities/test"

describe("github issues > #7775 MSSQL: Duplicate columns names return as an array, potentially breaking mapping", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mssql"],
            entities: [Parent, Child],
            dropSchema: true,
            schemaCreate: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should take the last column as the value, consistent with other drivers", () =>
        Promise.all(
            connections.map(async (connection) => {
                const results = await connection.manager.query(
                    `SELECT 1 as id, 2 as id UNION SELECT 5, NULL`,
                )
                expect(results.length).to.be.eql(2)
                expect(results[0].id).to.be.eql(2)
                expect(results[1].id).to.be.eql(null)
            }),
        ))

    it("should map the data properly if duplicate columns are present", () =>
        Promise.all(
            connections.map(async (connection) => {
                const parentRepo = await connection.getRepository(Parent)
                const childRepo = await connection.getRepository(Child)

                const parent = new Parent()
                parent.id = 1

                await parentRepo.save(parent)

                const child = new Child()
                child.id = 1
                child.parent = parent

                await childRepo.save(child)

                const results = await connection
                    .getRepository(Child)
                    .createQueryBuilder("child")
                    .andWhere("parent.id = :p0")
                    .setParameters({ p0: 1 })
                    .select(
                        "child.id, child.parent"
                            .split(",")
                            .map((i) => i.trim()),
                    )
                    .leftJoinAndSelect("child.parent", "parent", "1 = 1")
                    .getMany()

                expect(results.length).to.be.eql(1)
                expect(results[0]).to.be.instanceOf(Child)
                expect(results[0].parent).to.be.instanceOf(Parent)
                expect(results[0].parent.id).to.be.eq(1)
            }),
        ))
})
