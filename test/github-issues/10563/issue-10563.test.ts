import { assert } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Dog } from "./entity/family"

describe("github issues > #10653 Default value in child table/entity column decorator for multiple table inheritance is ignored for inherited columns", () => {
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

    it("should honor distinct default value configured on inherited column of child entity", async () =>
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager
                const dog: Dog = new Dog()
                dog.name = "Fifi"
                await manager.save(dog)
                const fifi = await manager.findOneBy(Dog, {
                    name: "Fifi",
                })
                assert(
                    fifi instanceof Dog && fifi["type"] == "PET",
                    `Fifi=${JSON.stringify(fifi)}`,
                )
            }),
        ))
})
