import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { One } from "./entity/One"
import { Three } from "./entity/Three"
import { Two } from "./entity/Two"

describe("benchmark > bulk-save-soft-remove-cascade > case1", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                __dirname,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("testing bulk cascade save then cascade soft remove of 200 objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ones: One[] = []

                for (let i = 1; i <= 200; i++) {
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
                await connection.manager.softRemove(ones)
            }),
        ))

    it("testing bulk cascade save then cascade soft remove of 500 objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ones: One[] = []

                for (let i = 1; i <= 500; i++) {
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
                await connection.manager.softRemove(ones)
            }),
        ))

    it("testing bulk cascade save then cascade soft remove of 5000 objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ones: One[] = []

                for (let i = 1; i <= 5000; i++) {
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
                await connection.manager.softRemove(ones)
            }),
        ))

    it("testing bulk cascade save then cascade soft remove of 10000 objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ones: One[] = []

                for (let i = 1; i <= 10000; i++) {
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
                await connection.manager.softRemove(ones)
            }),
        ))

    /**
     * Postgres
     *
     * ✓ testing bulk cascade save then cascade soft remove of 200 objects (700ms)
     * ✓ testing bulk cascade save then cascade soft remove of 500 objects (2610ms)
     * 1) testing bulk cascade save then cascade soft remove of 5000 objects
     * 2 passing (3m)
     * 1 failing
     *
     */
})
