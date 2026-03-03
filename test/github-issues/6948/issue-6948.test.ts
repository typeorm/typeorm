import "reflect-metadata"
import { Category } from "./entity/Category"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../test/utils/test-utils"

describe("github issues > #6948 TreeRepository's findRoots query incorrectly when using a custom primary key", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Category],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("entity parent column should work with custom primary column names ", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const categoryRepository =
                    connection.getTreeRepository(Category)
                await categoryRepository.save(
                    categoryRepository.create({
                        cat_name: "Root node",
                    }),
                )
                const rootNodes = await categoryRepository.findRoots()
                rootNodes[0].should.deep.include({
                    cat_name: "Root node",
                })
            }),
        ))
})
