import "reflect-metadata"
import { Raw } from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { FirstElement } from "./entity/entities"

describe("github issues > #11657 Generated hash aliases starting with digits cause SQL syntax errors in raw queries", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not fail when using Raw queries with generated hash aliases", async () => {
        return Promise.all(
            dataSources.map(async (dataSource) => {
                // Prepare test data
                const firstElementRepository =
                    dataSource.getRepository(FirstElement)

                // Test that nested relations with Raw queries don't cause SQL syntax errors
                await firstElementRepository.findOne({
                    where: {
                        second: {
                            third: {
                                id: Raw(
                                    (alias) => `EXISTS (
                                        SELECT 1 
                                        FROM third_element te
                                        WHERE te.id= ${alias}
                                      )`,
                                ),
                            },
                        },
                    },
                })
            }),
        )
    })
})
