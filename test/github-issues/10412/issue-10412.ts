import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index.js"
import { expect } from "chai"
import { documentRelationEntitySchema } from "./entity/entities"

describe("github issues > #10412 EntityPropertyNotFoundError when joinTable is used", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                logging: true,
                dropSchema: true,
                schemaCreate: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("repository has relations in metadata", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.manager.getRepository(
                    documentRelationEntitySchema,
                )
                expect(repository.metadata.relations.length).to.be.eql(1)
            }),
        ))

    it("save doesn't throw with EntityPropertyNotFoundError", () =>
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
