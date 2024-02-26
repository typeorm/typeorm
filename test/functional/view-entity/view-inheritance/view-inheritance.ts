
import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { VersionedChilddEntity, ChilddEntity } from "./entity/ChildEntity"
import { RootEntity, VersionedRootEntity, EnrichedRootEntity } from "./entity/RootEntity"

describe("views > views-inheritance", () => {
    let connections: DataSource[]
    before(
        async () => {
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [
                    VersionedChilddEntity,
                    VersionedRootEntity,
                    ChilddEntity,
                    RootEntity,
                    EnrichedRootEntity
                ],
            }));
        }
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

    it("should not type as a child entity in the case of an enriched view", () =>
        Promise.all(
            connections.map(async (connection) => {
                const childEntity = new VersionedChilddEntity()
                childEntity.id = 1
                childEntity.type = "ChildEntity"
                childEntity.additionalField = "thisIsAChildEntity"
                await connection.manager.save(childEntity)

                const entity = await connection.manager
                    .getRepository(EnrichedRootEntity)
                    .findOneByOrFail({ id: 1 })

                expect(entity.otherField).equal(
                    "thisisAnOtherField",
                )
            }),
        ))
})
