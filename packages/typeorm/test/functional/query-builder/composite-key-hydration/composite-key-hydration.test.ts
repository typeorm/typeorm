import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"

describe("query builder > composite key hydration", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({ entities: [Record] })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should keep colliding composite keys and their children separate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const first = await repository.save({
                    namespace: "a_b",
                    key: "c",
                })
                const second = await repository.save({
                    namespace: "a",
                    key: "b_c",
                })
                await repository.save([
                    { namespace: "child", key: "first", parent: first },
                    { namespace: "child", key: "second", parent: second },
                ])

                const records = await repository
                    .createQueryBuilder("record")
                    .leftJoinAndSelect("record.children", "child")
                    .where("record.parentNamespace IS NULL")
                    .orderBy("record.namespace", "ASC")
                    .getMany()

                expect(records).to.have.length(2)
                expect(
                    records.map((record) => ({
                        namespace: record.namespace,
                        key: record.key,
                        children: record.children.map((child) => child.key),
                    })),
                ).to.deep.equal([
                    { namespace: "a", key: "b_c", children: ["second"] },
                    { namespace: "a_b", key: "c", children: ["first"] },
                ])
            }),
        ))

    it("should preserve every joined child with colliding composite keys", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const parent = await repository.save({
                    namespace: "root",
                    key: "root",
                })
                await repository.save([
                    { namespace: "a_b", key: "c", parent },
                    { namespace: "a", key: "b_c", parent },
                    { namespace: "a_", key: "_b", parent },
                    { namespace: "a", key: "__b", parent },
                ])

                const loaded = await repository.findOneOrFail({
                    where: { namespace: parent.namespace, key: parent.key },
                    relations: { children: true },
                })

                expect(
                    loaded.children.map((child) => [
                        child.namespace,
                        child.key,
                    ]),
                ).to.have.deep.members([
                    ["a_b", "c"],
                    ["a", "b_c"],
                    ["a_", "_b"],
                    ["a", "__b"],
                ])
            }),
        ))
})
