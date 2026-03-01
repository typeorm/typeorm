import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Thing, EmbeddedInThing } from "./entity/thing"
import { expect } from "chai"

describe("github issues > #1825 Invalid field values being loaded with long camelCased embedded field names.", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql", "postgres", "mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load valid values in embedded with long field names", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const thingRepository = connection.getRepository(Thing)

                const thing = new Thing()
                const embeddedThing = new EmbeddedInThing()
                embeddedThing.someSeriouslyLongFieldNameFirst = 1
                embeddedThing.someSeriouslyLongFieldNameSecond = 2
                thing.embeddedThing = embeddedThing

                await thingRepository.save(thing)

                const loadedThing = await thingRepository.findOneBy({
                    id: thing.id,
                })

                expect(loadedThing).to.eql(thing)
            }),
        ))
})
