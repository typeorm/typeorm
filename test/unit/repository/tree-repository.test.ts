import "reflect-metadata"
import { expect } from "chai"
import { Column } from "../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../src/decorator/entity/Entity"
import { Tree } from "../../../src/decorator/tree/Tree"
import { TreeChildren } from "../../../src/decorator/tree/TreeChildren"
import { TreeParent } from "../../../src/decorator/tree/TreeParent"
import { DataSource } from "../../../src/data-source/DataSource"

class TestDataSource extends DataSource {
    buildTestMetadatas(): Promise<void> {
        return this.buildMetadatas()
    }
}

@Entity()
@Tree("closure-table")
class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeParent()
    parent: Category

    @TreeChildren()
    children: Category[]
}

describe("TreeRepository", () => {
    it("does not treat schema-qualified closure tables as relation paths", async () => {
        const dataSource = new TestDataSource({
            type: "postgres",
            schema: "public",
            entities: [Category],
        })

        await dataSource.buildTestMetadatas()

        const category = new Category()
        category.id = 1
        const repository = dataSource.getTreeRepository(Category)

        const queryBuilder = repository.createDescendantsQueryBuilder(
            "treeEntity",
            "treeClosure",
            category,
        )

        expect(queryBuilder.getQuery()).to.contain(
            `INNER JOIN "public"."category_closure" "treeClosure"`,
        )
    })
})
