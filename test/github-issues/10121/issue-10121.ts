import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { CityModel } from "./entity/city"
import { EstateModel } from "./entity/estate"
import { PrefModel } from "./entity/pref"

describe("github issues > #10121 Multiple relations with same columns", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not throw error when loading entities with relations using EntityManager", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(PrefModel).save([
                    { id: "1", name: "Tokyo", kanaName: "Tokyo" },
                    { id: "2", name: "Osaka", kanaName: "Osaka" },
                ])

                await dataSource.getRepository(CityModel).save([
                    { id: "1", prefId: "1", name: "Tokyo" },
                    { id: "2", prefId: "1", name: "Shinjuku" },
                    { id: "3", prefId: "2", name: "Osaka" },
                    { id: "4", prefId: "2", name: "Namba" },
                ])

                await dataSource.getRepository(EstateModel).save([
                    { name: "Tokyo Tower", prefId: "1", cityId: "1" },
                    { name: "Osaka Castle", prefId: "2", cityId: "3" },
                ])

                const estates = await dataSource
                    .getRepository(EstateModel)
                    .find({ relations: ["city", "pref"] })

                estates.length.should.be.eql(2)
                estates.should.include.deep.members([
                    {
                        id: 1,
                        name: "Tokyo Tower",
                        prefId: "1",
                        cityId: "1",
                        city: { id: "1", prefId: "1", name: "Tokyo" },
                        pref: { id: "1", name: "Tokyo", kanaName: "Tokyo" },
                    },
                    {
                        id: 2,
                        name: "Osaka Castle",
                        prefId: "2",
                        cityId: "3",
                        city: { id: "3", prefId: "2", name: "Osaka" },
                        pref: { id: "2", name: "Osaka", kanaName: "Osaka" },
                    },
                ])
            }),
        ))
})
