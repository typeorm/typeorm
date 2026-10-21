import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { FloatingRecord } from "./entity/FloatingRecord"

// Regression for #12902: JSON must not collapse non-finite keys to null.
describe("query builder > composite floating key hydration", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [FloatingRecord],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should keep non-finite root and joined keys distinct", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(FloatingRecord)
                const parent = repository.create({
                    namespace: "parent",
                    key: 0,
                })
                await repository.insert(parent)
                const keys = [NaN, Infinity, -Infinity]
                for (const key of keys) {
                    const child = repository.create({
                        namespace: "child",
                        key,
                        parent,
                    })
                    await repository.insert(child)
                    await repository.insert({
                        namespace: "leaf",
                        key,
                        parent: child,
                    })
                }

                const children = await repository.find({
                    where: { namespace: "child" },
                    relations: { children: true },
                })
                expect(
                    children.map((child) => ({
                        key: String(child.key),
                        children: child.children.map((leaf) =>
                            String(leaf.key),
                        ),
                    })),
                ).to.have.deep.members(
                    keys.map((key) => ({
                        key: String(key),
                        children: [String(key)],
                    })),
                )

                const loadedParent = await repository.findOneOrFail({
                    where: { namespace: parent.namespace, key: parent.key },
                    relations: { children: true },
                })
                expect(
                    loadedParent.children.map((child) => String(child.key)),
                ).to.have.members(keys.map(String))
            }),
        ))
})
