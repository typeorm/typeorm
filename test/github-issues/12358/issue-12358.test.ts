import { expect } from "chai"
import "reflect-metadata"
import { CapacitorQueryRunner } from "../../../src/driver/capacitor/CapacitorQueryRunner"

describe("github issues > #12358 capacitor affected rows", () => {
    it("should return affected rows in default query result (without structured result)", async () => {
        const mockConnection = {
            run: async () => ({
                changes: {
                    changes: 1,
                    lastId: 1,
                },
            }),
            query: async () => ({ values: [] }),
            execute: async () => ({}),
        }

        const mockDriver: any = {
            dataSource: {
                logger: {
                    logQuery: () => {},
                    logQueryError: () => {},
                },
            },
        }

        const runner = new CapacitorQueryRunner(mockDriver)

        runner.connect = async () => mockConnection as any

        const result: any = await runner.query("DELETE FROM test WHERE id = 1")

        console.log("DEFAULT RESULT:", result)

        expect(result).to.have.property("affected")
        expect(result.affected).to.equal(1)
    })
})
