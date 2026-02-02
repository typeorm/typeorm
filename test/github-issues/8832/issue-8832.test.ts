import { expect } from "chai"
import { DataSource } from "../../../src"
import { ConnectionMetadataBuilder } from "../../../src/connection/ConnectionMetadataBuilder"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { EntityMetadataValidator } from "../../../src/metadata-builder/EntityMetadataValidator"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { BadInet4 } from "./badEntity/BadInet4"
import { BadInet6 } from "./badEntity/BadInet6"
import { BadUuid } from "./badEntity/BadUuid"
import { Address } from "./entity/Address"
import { User } from "./entity/User"

describe("github issues > #8832 Add uuid, inet4 and inet6 types for mariadb", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Address, User],
            enabledDrivers: ["mariadb"],
            driverSpecific: {
                synchronize: false,
            },
        })

        // uuid is available since 10.7
        // inet4 is available since 10.10
        // inet6 is available since 10.5
        await Promise.all(
            connections.map(async (connection) => {
                if (
                    !DriverUtils.isReleaseVersionOrGreater(
                        connection.driver,
                        "10.10",
                    )
                ) {
                    await connection.destroy()

                    return
                }

                await connection.synchronize()
            }),
        )

        connections = connections.filter(
            (connection) => connection.isInitialized,
        )
    })
    afterAll(() => closeTestingConnections(connections))

    it("should create table with uuid, inet4, and inet6 type set to column for relevant mariadb versions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)

                const newUser = await userRepository.save({
                    uuid: "ceb2897c-a1cf-11ed-8dbd-040300000000",
                    inet4: "192.0.2.146",
                    inet6: "2001:0db8:0000:0000:0000:ff00:0042:8329",
                })

                const savedUser = await userRepository.findOneOrFail({
                    where: { uuid: newUser.uuid },
                })

                const foundUser = await userRepository.findOne({
                    where: { id: savedUser.id },
                })

                expect(foundUser).to.not.be.null
                expect(foundUser!.uuid).to.deep.equal(newUser.uuid)
                expect(foundUser!.inet4).to.deep.equal(newUser.inet4)
                expect(foundUser!.inet6).to.deep.equal("2001:db8::ff00:42:8329")
                expect(foundUser!.another_uuid_field).to.not.be.undefined

                const columnTypes: {
                    COLUMN_NAME: string
                    DATA_TYPE: string
                }[] = await connection.sql`
                    SELECT
                        COLUMN_NAME,
                        DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE
                        TABLE_SCHEMA = ${connection.driver.database}
                        AND TABLE_NAME = 'user'
                        AND COLUMN_NAME IN ('id', 'uuid', 'inet4', 'inet6', 'anotherUuid')`

                const expectedColumnTypes: Record<string, string> = {
                    id: "uuid",
                    uuid: "uuid",
                    inet4: "inet4",
                    inet6: "inet6",
                    another_uuid_field: "uuid",
                }

                columnTypes.forEach(({ COLUMN_NAME, DATA_TYPE }) => {
                    expect(DATA_TYPE).to.equal(expectedColumnTypes[COLUMN_NAME])
                })

                // save a relation
                const addressRepository = connection.getRepository(Address)

                const newAddress: Address = {
                    city: "Codersville",
                    state: "Coderado",
                    user: foundUser!,
                }

                await addressRepository.save(newAddress)

                const foundAddress = await addressRepository.findOne({
                    where: { user: { id: foundUser!.id } },
                })

                expect(foundAddress).to.not.be.null
            }),
        ))

    it("should throw error if mariadb uuid is supported and length is provided to property", async () =>
        Promise.all(
            connections.map(async (connection) => {
                // version supports all the new types
                connection.driver.version = "10.10.0"

                const connectionMetadataBuilder = new ConnectionMetadataBuilder(
                    connection,
                )
                const entityMetadatas =
                    await connectionMetadataBuilder.buildEntityMetadatas([
                        BadInet4,
                        BadInet6,
                        BadUuid,
                    ])
                const entityMetadataValidator = new EntityMetadataValidator()
                entityMetadatas.forEach((entityMetadata) => {
                    expect(() =>
                        entityMetadataValidator.validate(
                            entityMetadata,
                            entityMetadatas,
                            connection.driver,
                        ),
                    ).to.throw(Error)
                })
            }),
        ))
})
