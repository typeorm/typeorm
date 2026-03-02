import "../../utils/test-setup"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { DummyJSONEntity } from "./entity/json-entity"
import { DummyJSONBEntity } from "./entity/jsonb-entity"

describe("other issues > correctly compute change for transformed json / jsonb columns", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not update entity if transformed JSON column did not change", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repository = connection.getRepository(DummyJSONEntity)

                const dummy = repository.create({
                    value: {
                        secretProperty: "hello",
                    },
                })

                await repository.save(dummy)

                await repository.save(dummy)

                const dummyEntity = await repository.findOneByOrFail({
                    id: dummy.id,
                })
                expect(dummyEntity.version).to.equal(1)
            }),
        ))

    it("should not update entity if transformed JSONB column did not change", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repository = connection.getRepository(DummyJSONBEntity)

                const dummy = repository.create({
                    value: {
                        secretProperty: "hello",
                    },
                })

                await repository.save(dummy)

                await repository.save(dummy)

                const dummyEntity = await repository.findOneByOrFail({
                    id: dummy.id,
                })
                expect(dummyEntity.version).to.equal(1)
            }),
        ))
})
