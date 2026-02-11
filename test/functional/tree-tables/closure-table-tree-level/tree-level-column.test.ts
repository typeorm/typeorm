import "reflect-metadata"
import { Category } from "./entity/Category"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("tree tables > closure-table with TreeLevelColumn", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Category],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should save categories with TreeLevelColumn without not-null constraint violation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const categoryRepository =
                    connection.getTreeRepository(Category)

                const a1 = new Category()
                a1.name = "a1"
                await categoryRepository.save(a1)

                const a11 = new Category()
                a11.name = "a11"
                a11.parentCategory = a1
                await categoryRepository.save(a11)

                const a12 = new Category()
                a12.name = "a12"
                a12.parentCategory = a1
                await categoryRepository.save(a12)

                const rootCategories = await categoryRepository.findRoots()
                rootCategories.length.should.be.equal(1)
                rootCategories[0].id.should.equal(1)
                rootCategories[0].name.should.equal("a1")

                const a11Parent = await categoryRepository.findAncestors(a11)
                a11Parent.length.should.be.equal(2)
                const a11ParentIds = a11Parent.map((c) => c.id)
                a11ParentIds.should.include(1)
                a11ParentIds.should.include(2)

                const a1Children = await categoryRepository.findDescendants(a1)
                a1Children.length.should.be.equal(3)
                const a1ChildrenIds = a1Children.map((c) => c.id)
                a1ChildrenIds.should.include(1)
                a1ChildrenIds.should.include(2)
                a1ChildrenIds.should.include(3)
            }),
        ))

    it("should save categories via children with TreeLevelColumn", () =>
        Promise.all(
            connections.map(async (connection) => {
                const categoryRepository =
                    connection.getTreeRepository(Category)

                const a1 = new Category()
                a1.name = "a1"

                const a11 = new Category()
                a11.name = "a11"

                const a12 = new Category()
                a12.name = "a12"

                a1.childCategories = [a11, a12]
                await categoryRepository.save(a1)

                const rootCategories = await categoryRepository.findRoots()
                rootCategories.length.should.be.equal(1)
                rootCategories[0].id.should.equal(1)
                rootCategories[0].name.should.equal("a1")

                const a1Children = await categoryRepository.findDescendants(a1)
                a1Children.length.should.be.equal(3)
            }),
        ))
})
