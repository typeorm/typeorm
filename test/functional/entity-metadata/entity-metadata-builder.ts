import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { documentRelationEntitySchema } from "./entity/junction-table/entities"

describe("entity-metadata-builder > build", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/junction-table/*{.js,.ts}"],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("repository has relations in metadata when user defined junction tables are used", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.manager.getRepository(
                    documentRelationEntitySchema,
                )
                expect(repository.metadata.relations.length).to.be.eql(1)
            }),
        ))

    it("save doesn't throw with EntityPropertyNotFoundError when user defined junction tables are used", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.manager.getRepository(
                    documentRelationEntitySchema,
                )
                await expect(
                    repository.find({
                        where: { userId: 2030 },
                        relations: ["document"],
                    }),
                ).to.not.be.rejected
            }),
        ))
})
