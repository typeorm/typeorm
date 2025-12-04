import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import "reflect-metadata"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Example } from "./entity/Example"

describe("query builder > parameters > sqlite", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Example],
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should replace basic parameters when executing", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save({ id: "bar" })

                const example = await repo
                    .createQueryBuilder()
                    .setParameter("foo", "bar")
                    .where("example.id = :foo")
                    .getOne()

                expect(example?.id).to.be.equal("bar")
            }),
        ))

    it("should prevent invalid characters from being used as identifiers", () =>
        Promise.all(
            connections.map(async (connection) => {
                const b = connection.createQueryBuilder()

                expect(() => b.setParameter(":foo", "bar")).to.throw()
                expect(() => b.setParameter("@foo", "bar")).to.throw()
                expect(() => b.setParameter("😋", "bar")).to.throw()
                expect(() => b.setParameter("foo bar", "bar")).to.throw()
            }),
        ))

    it("should allow periods in parameters", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Example)

                await repo.save({ id: "bar" })

                const example = await repo
                    .createQueryBuilder()
                    .setParameter("f.o.o", "bar")
                    .where("example.id = :f.o.o")
                    .getOne()

                expect(example?.id).to.be.equal("bar")
            }),
        ))
})
