import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import type { FindManyOptions } from "../../../../../src/find-options/FindManyOptions"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Album } from "./entity/Album"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

// https://github.com/typeorm/typeorm/issues/9582
describe("relations > load-strategy > where on a loaded relation", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const setup = async (dataSource: DataSource) => {
        const [alice, bob] = await dataSource
            .getRepository(User)
            .save([{ name: "alice" }, { name: "bob" }])
        const [holiday, work] = await dataSource.getRepository(Album).save([
            { name: "holiday", user: alice },
            { name: "work", user: alice },
        ])
        await dataSource.getRepository(Photo).save([
            { name: "beach", album: holiday, owner: alice },
            { name: "hotel", album: holiday, owner: bob },
            { name: "desk", album: work, owner: bob },
        ])
        return { alice }
    }

    const findWith = (
        dataSource: DataSource,
        strategy: "join" | "query",
        options: FindManyOptions<Album>,
    ) =>
        dataSource.getRepository(Album).find({
            ...options,
            relationLoadStrategy: strategy,
            order: { id: "ASC", photos: { id: "ASC" } },
        })

    it("filters the relation it loads the same way for both strategies", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { alice } = await setup(dataSource)
                const options: FindManyOptions<Album> = {
                    relations: { photos: { owner: true }, user: true },
                    where: {
                        user: { id: alice.id },
                        photos: { owner: { id: alice.id } },
                    },
                }

                const joined = await findWith(dataSource, "join", options)
                const queried = await findWith(dataSource, "query", options)

                expect(joined.map((album) => album.name)).to.eql(["holiday"])
                expect(joined[0].photos.map((photo) => photo.name)).to.eql([
                    "beach",
                ])
                expect(queried).to.eql(joined)
            }),
        ))

    it("keeps conditions of a supplied query builder within the loaded relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await setup(dataSource)
                const holiday = await dataSource
                    .getRepository(Album)
                    .findOneByOrFail({ name: "holiday" })
                const relation = dataSource
                    .getMetadata(Album)
                    .findRelationWithPropertyPath("photos")!
                const queryBuilder = dataSource
                    .createQueryBuilder(Photo, "photo")
                    .where("photo.name = :desk", { desk: "desk" })
                    .orWhere("photo.name = :beach", { beach: "beach" })

                const photos: Photo[] = await dataSource.relationLoader.load(
                    relation,
                    holiday,
                    undefined,
                    queryBuilder,
                )

                expect(photos.map((photo) => photo.name)).to.eql(["beach"])
            }),
        ))
})
