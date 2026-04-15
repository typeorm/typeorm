import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../src"

@Entity()
export class EntityWithDefaultValues {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: () => "md5((now())::text)" })
    token: string

    @Column({ type: "date", default: () => "now()" })
    createdDate: string

    @Column("jsonb", { default: { foo: "bar" } })
    data: any

    @Column("text", { default: "baz" })
    text: string

    @Column("text", { default: "2001:db8::1" })
    ipAddress: string

    @Column("inet", { default: () => "'2001:db8::1'::inet" })
    ipAddressWithCast: string
}

describe("schema builder > #1729 change default value", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [EntityWithDefaultValues],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not generate queries when function default is already set", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.be.empty
                expect(sqlInMemory.downQueries).to.be.empty
            }),
        )
    })
})
