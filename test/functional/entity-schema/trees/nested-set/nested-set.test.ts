import "reflect-metadata"
import { Category } from "./entity/Category"

import { DataSource } from "../../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../../utils/test-utils"

describe("entity-schema > tree tables > nested-set", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Category],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("attach should work properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const categoryRepository =
                    connection.getTreeRepository(Category)

                const a1 = await categoryRepository.save({ name: "a1" })

                const a11 = await categoryRepository.save({
                    name: "a11",
                    parentCategory: a1,
                })

                await categoryRepository.save({
                    name: "a111",
                    parentCategory: a11,
                })

                await categoryRepository.save({
                    name: "a12",
                    parentCategory: a1,
                })

                const rootCategories = await categoryRepository.findRoots()
                rootCategories.should.be.eql([
                    {
                        id: 1,
                        name: "a1",
                    },
                ])

                const a11Parent = await categoryRepository.findAncestors(a11)
                const a11ParentNames = a11Parent.map((i) => i.name)
                a11ParentNames.length.should.be.equal(2)
                a11ParentNames.should.deep.include("a1")
                a11ParentNames.should.deep.include("a11")

                const a1Children = await categoryRepository.findDescendants(a1)
                const a1ChildrenNames = a1Children.map((i) => i.name)
                a1ChildrenNames.length.should.be.equal(4)
                a1ChildrenNames.should.deep.include("a1")
                a1ChildrenNames.should.deep.include("a11")
                a1ChildrenNames.should.deep.include("a111")
                a1ChildrenNames.should.deep.include("a12")
            }),
        ))
})
