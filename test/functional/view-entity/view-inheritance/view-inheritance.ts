import { expect } from "chai"
import "reflect-metadata"
import { ChildEntity, DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { VersionedChilddEntity } from "./entity/ChildEntity"
import { RootEntity, VersionedRootEntity } from "./entity/RootEntity"

describe("views > views-inheritance", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [
                    ChildEntity,
                    VersionedChilddEntity,
                    RootEntity,
                    VersionedRootEntity,
                ],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should be able to type correctly the children when going through the filtered view", () =>
        Promise.all(
            connections.map(async (connection) => {
                const childEntity = new VersionedChilddEntity()
                childEntity.id = 1
                childEntity.type = "ChildEntity"
                childEntity.additionalField = "thisIsAChildEntity"
                await connection.manager.save(childEntity)

                const entity = await connection.manager
                    .getRepository(RootEntity)
                    .findOneByOrFail({ id: 1 })

                expect((entity as VersionedChilddEntity).additionalField).equal(
                    "thisIsAChildEntity",
                )
                // Ideally we can have the child entity class later
                // expect(
                //     (entity as VersionedChilddEntity).constructor.name,
                // ).equal("ChilddEntity")
            }),
        ))
})
