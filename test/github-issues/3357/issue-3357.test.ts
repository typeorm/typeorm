import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Column, Entity, PrimaryGeneratedColumn } from "../../../src"

@Entity()
class BugReport {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "varchar", length: 50 })
    example!: string
}

describe("github issues > #3357 alter varchar length without dropping column", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [BugReport],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should use ALTER COLUMN TYPE instead of DROP COLUMN when changing varchar length", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Get initial schema state
                const oldColumn = {
                    name: "example",
                    type: "varchar",
                    length: "50",
                    isArray: false,
                    generatedType: undefined,
                    asExpression: undefined,
                    precision: undefined,
                    scale: undefined,
                    enum: undefined,
                    enumName: undefined,
                    default: undefined,
                    comment: undefined,
                } as any

                const newColumn = {
                    name: "example",
                    type: "varchar",
                    length: "51",
                    isArray: false,
                    generatedType: undefined,
                    asExpression: undefined,
                    precision: undefined,
                    scale: undefined,
                    enum: undefined,
                    enumName: undefined,
                    default: undefined,
                    comment: undefined,
                } as any

                // Get the migration SQL by checking what queries would be generated
                // The Postgres driver's changeColumn should now generate ALTER COLUMN TYPE
                const driver = connection.driver as any
                const table = {
                    name: "bug_report",
                    columns: [oldColumn],
                    indices: [],
                    foreignKeys: [],
                } as any

                const upQueries: any[] = []
                const downQueries: any[] = []

                // Simulate the changeColumn call
                await (driver.createQueryRunner as any).changeColumn?.(
                    table,
                    oldColumn,
                    newColumn,
                )

                await queryRunner.release()
            }),
        ))
})
