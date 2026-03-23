import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Publisher } from "./entity/Publisher"
import { Magazine } from "./entity/Magazine"
import { Journalist } from "./entity/Journalist"

describe("relations > load-strategy > query > circular eager (Publisher→Magazine→Journalist→Publisher)", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should not recurse infinitely with circular eager relations and query strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const journalist = await dataSource
                    .getRepository(Journalist)
                    .save(
                        dataSource
                            .getRepository(Journalist)
                            .create({ name: "Jane" }),
                    )
                const magazine = await dataSource
                    .getRepository(Magazine)
                    .save(
                        dataSource
                            .getRepository(Magazine)
                            .create({ name: "Tech Weekly", journalist }),
                    )
                const publisher = await dataSource
                    .getRepository(Publisher)
                    .save(
                        dataSource
                            .getRepository(Publisher)
                            .create({ name: "Acme Press", magazine }),
                    )

                // close the cycle: Journalist→Publisher
                journalist.publisher = publisher
                await dataSource.getRepository(Journalist).save(journalist)

                const result = await dataSource
                    .getRepository(Publisher)
                    .findOne({
                        where: { id: publisher.id },
                        relationLoadStrategy: "query",
                    })

                expect(result).to.not.be.null
                expect(result?.name).to.equal("Acme Press")
                expect(result?.magazine?.name).to.equal("Tech Weekly")
                expect(result?.magazine?.journalist?.name).to.equal("Jane")
            }),
        ))
})
