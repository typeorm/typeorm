import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import { SelectQueryBuilder } from "../../../../src/query-builder/SelectQueryBuilder"

describe("query builder > #10814 - subquery join with pagination and orderBy on subquery alias", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    async function prepareData(connection: DataSource) {
        const parent1 = new Parent()
        parent1.name = "Alpha"
        await connection.manager.save(parent1)

        const parent2 = new Parent()
        parent2.name = "Beta"
        await connection.manager.save(parent2)

        const parent3 = new Parent()
        parent3.name = "Gamma"
        await connection.manager.save(parent3)

        for (let i = 1; i <= 5; i++) {
            const child = new Child()
            child.name = `Child ${i}`
            child.parent = parent1
            await connection.manager.save(child)
        }

        for (let i = 6; i <= 10; i++) {
            const child = new Child()
            child.name = `Child ${i}`
            child.parent = parent2
            await connection.manager.save(child)
        }

        for (let i = 11; i <= 15; i++) {
            const child = new Child()
            child.name = `Child ${i}`
            child.parent = parent3
            await connection.manager.save(child)
        }
    }

    it("should not throw when using innerJoin subquery with orderBy on subquery alias and pagination", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const qb = connection
                    .createQueryBuilder()
                    .select("child")
                    .from(Child, "child")
                    .innerJoin(
                        (subquery: SelectQueryBuilder<Parent>) => {
                            return subquery
                                .select("p.id", "id")
                                .addSelect("p.name", "name")
                                .from(Parent, "p")
                        },
                        "s",
                        "child.parentId = s.id",
                    )
                    .orderBy("s.name")
                    .take(5)
                    .skip(0)

                const [data, count] = await qb.getManyAndCount()

                data.length.should.be.lessThanOrEqual(5)
                count.should.be.equal(15)
            }),
        ))

    it("should not throw when orderBy on subquery alias is used without pagination", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const qb = connection
                    .createQueryBuilder()
                    .select("child")
                    .from(Child, "child")
                    .innerJoin(
                        (subquery: SelectQueryBuilder<Parent>) => {
                            return subquery
                                .select("p.id", "id")
                                .addSelect("p.name", "name")
                                .from(Parent, "p")
                        },
                        "s",
                        "child.parentId = s.id",
                    )
                    .orderBy("s.name")

                const data = await qb.getMany()

                data.length.should.be.equal(15)
            }),
        ))

    it("should not throw when using take/skip without orderBy on subquery alias", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const qb = connection
                    .createQueryBuilder()
                    .select("child")
                    .from(Child, "child")
                    .innerJoin(
                        (subquery: SelectQueryBuilder<Parent>) => {
                            return subquery
                                .select("p.id", "id")
                                .addSelect("p.name", "name")
                                .from(Parent, "p")
                        },
                        "s",
                        "child.parentId = s.id",
                    )
                    .take(5)
                    .skip(0)

                const [data, count] = await qb.getManyAndCount()

                data.length.should.be.lessThanOrEqual(5)
                count.should.be.equal(15)
            }),
        ))
})
