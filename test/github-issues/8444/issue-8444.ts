import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { StrictlyInitializedEntity } from "./entity/StrictlyInitializedEntity"
import { DataSource } from "../../../src"

describe("github issues > #8444 entitySkipConstructor not working", () => {
    describe("without entitySkipConstructor", () => {
        it("createTestingConnections should fail with 'someColumn cannot be undefined.'", async () => {
            async function bootstrapWithoutEntitySkipConstructor(): Promise<
                DataSource[]
            > {
                return await createTestingConnections({
                    driverSpecific: {
                        entitySkipConstructor: false,
                    },
                    entities: [StrictlyInitializedEntity],
                    schemaCreate: true,
                    dropSchema: true,
                })
            }

            await expect(
                bootstrapWithoutEntitySkipConstructor(),
            ).to.be.rejectedWith("someColumn cannot be undefined")
        })
    })

    describe("with entitySkipConstructor", () => {
        let connections: DataSource[] = []
        afterEach(() => closeTestingConnections(connections))

        it("createTestingConnections should succeed", async () => {
            connections = await createTestingConnections({
                driverSpecific: {
                    entitySkipConstructor: true,
                },
                entities: [StrictlyInitializedEntity],
                schemaCreate: true,
                dropSchema: true,
            })
        })
    })
})
