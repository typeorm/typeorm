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

describe("benchmark > bulk-save-cascade > case1", () => {
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

    it("testing bulk save of 200 with two relations objects", () =>
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
            }),
        ))

    it("testing bulk save of 500 with two relations objects", () =>
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
            }),
        ))

    it("testing bulk save of 1000 with two relations objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ones: One[] = []

                for (let i = 1; i <= 1000; i++) {
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
        ))

    it("testing bulk save of 5000 with two relations objects", () =>
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
            }),
        ))

    it("testing bulk save of 10000 with two relations objects", () =>
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
            }),
        ))

    /**
     * Postgres
     *
     * ✓ testing bulk save of 200 with two relations objects (75ms)
     * ✓ testing bulk save of 500 with two relations objects (135ms)
     * ✓ testing bulk save of 1000 with two relations objects (211ms)
     * ✓ testing bulk save of 5000 with two relations objects (2266ms)
     * ✓ testing bulk save of 10000 with two relations objects (12210ms)
     *
     */
})
