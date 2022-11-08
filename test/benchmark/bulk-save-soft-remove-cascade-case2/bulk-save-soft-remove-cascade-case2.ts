import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { One } from "./entity/One"
import { Three } from "./entity/Three"
import { Two } from "./entity/Two"

describe("benchmark > bulk-save-soft-remove-cascade > case2", () => {
    let connections: DataSource[]
    let ones: One[] = []
    before(
        async () =>
            (connections = await createTestingConnections({
                __dirname,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() =>
        Promise.all(
            connections.map(async (connection) => {
                for (let i = 1; i <= 2500; i++) {
                    const one = new One()
                    const two = new Two()
                    const three = new Three()
                    one.text = `One #${i}`
                    two.text = `Two #${i}`
                    three.text = `Three #${i}`
                    one.two = two
                    one.three = three
                    ones.push(one)
                }

                await connection.manager.save(ones)
            }),
        ),
    )
    after(() => closeTestingConnections(connections))

    it("testing bulk soft remove of 2500 with relations objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.softRemove(ones)
            }),
        ))

    /**
     * Postgres
     *
     * ✓ testing bulk soft remove of 2500 with relations objects (55972ms)
     *
     */
})
