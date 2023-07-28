import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { Photo } from "./entity/Photo"

describe("github issues > #10140 timestamp type column doesn't work when using sqlite", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return date who has timestamp type column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const photo = dataSource.manager.create(Photo)

                const publishedAt = new Date("2023-06-16T08:24:53Z")
                photo.name = "photo"
                photo.publishedAt = publishedAt
                await dataSource.manager.save(photo)

                const freshPhoto = await dataSource.manager.findOneByOrFail(
                    Photo,
                    {
                        name: "photo",
                    },
                )

                expect(freshPhoto.publishedAt instanceof Date).equal(true)
                expect(freshPhoto.publishedAt.toISOString()).equal(
                    publishedAt.toISOString(),
                )
            }),
        ))
})
