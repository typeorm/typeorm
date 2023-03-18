import "../../utils/test-setup"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import {
    Column,
    DatabaseType,
    DataSource,
    Entity,
    PrimaryGeneratedColumn,
    TypeORMError,
} from "../../../src/index"
import { expect } from "chai"
import { User } from "../8832/entity/User"
import { VersionUtils } from "../../../src/util/VersionUtils"
import { Address } from "./entity/Address"

function getSupportedTypesMap(
    type: DatabaseType,
    version: string,
): {
    allowsUuidType: boolean
    allowsInet4Type: boolean
    allowsInet6Type: boolean
} {
    return {
        allowsUuidType:
            type === "mariadb" &&
            VersionUtils.isGreaterOrEqual(version, "10.7.0"),
        allowsInet4Type:
            type === "mariadb" &&
            VersionUtils.isGreaterOrEqual(version, "10.10.0"),
        allowsInet6Type:
            type === "mariadb" &&
            VersionUtils.isGreaterOrEqual(version, "10.5.0"),
    }
}

describe("github issues > #8832 Add uuid, inet4, and inet6 types for mariadb", () => {
    let connections: DataSource[]

    afterEach(() => closeTestingConnections(connections))

    describe("basic use of new maria db types", () => {
        const newUser: User = {
            uuid: "ceb2897c-a1cf-11ed-8dbd-040300000000",
            inet4: "192.0.2.146",
            inet6: "2001:0db8:0000:0000:0000:ff00:0042:8329",
        }

        const expectedInet6 = "2001:db8::ff00:42:8329"

        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: ["mysql", "mariadb"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))

        it("should create table with uuid type set to column for relevant mariadb versions", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const userRepository = connection.getRepository(User)

                    // seems there is an issue with the persisting id that crosses over from mysql to mariadb
                    await userRepository.save(newUser)

                    const savedUser = await userRepository.findOneOrFail({
                        where: { uuid: newUser.uuid },
                    })

                    const foundUser = await userRepository.findOne({
                        where: { id: savedUser.id },
                    })

                    const {
                        options: { type },
                        driver: { version = "0.0.0" },
                    } = connection

                    const { allowsUuidType, allowsInet4Type, allowsInet6Type } =
                        getSupportedTypesMap(type, version)

                    expect(foundUser).to.not.be.null
                    expect(foundUser!.uuid).to.deep.equal(newUser.uuid)
                    expect(foundUser!.inet4).to.deep.equal(newUser.inet4)
                    expect(foundUser!.inet6).to.deep.equal(
                        allowsInet6Type ? expectedInet6 : newUser.inet6,
                    )
                    expect(foundUser!.another_uuid_field).to.not.be.undefined

                    const columnTypes: {
                        COLUMN_NAME: string
                        DATA_TYPE: string
                    }[] = await connection.query(
                        `
                        SELECT 
                            COLUMN_NAME,
                            DATA_TYPE 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE
                            TABLE_SCHEMA = ?
                            AND TABLE_NAME = ? 
                            AND COLUMN_NAME IN (?, ?, ?, ?)
                    `,
                        [
                            connection.driver.database,
                            "user",
                            "id",
                            "uuid",
                            "inet4",
                            "inet6",
                            "anotherUuid",
                        ],
                    )
                    const expectedColumnTypes: Record<string, string> = {
                        id: allowsUuidType ? "uuid" : "varchar",
                        uuid: allowsUuidType ? "uuid" : "varchar",
                        inet4: allowsInet4Type ? "inet4" : "varchar",
                        inet6: allowsInet6Type ? "inet6" : "varchar",
                        another_uuid_field: allowsUuidType ? "uuid" : "varchar",
                    }

                    columnTypes.forEach(({ COLUMN_NAME, DATA_TYPE }) => {
                        expect(DATA_TYPE).to.equal(
                            expectedColumnTypes[COLUMN_NAME],
                        )
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
    })

    describe("mariadb entity manager metadata validations for uuid, inet4, inet6 types", () => {
        @Entity()
        class BadUuidEntity {
            @PrimaryGeneratedColumn("uuid")
            id?: string

            @Column({ type: "uuid", length: "36" })
            badUuid: string
        }

        @Entity()
        class BadInet4Entity {
            @PrimaryGeneratedColumn("uuid")
            id?: string

            @Column({ type: "inet4", length: "28" })
            badinet4: string
        }

        @Entity()
        class BadInet6Entity {
            @PrimaryGeneratedColumn("uuid")
            id?: string

            @Column({ type: "inet6", length: "28" })
            badinet6: string
        }

        afterEach(() => closeTestingConnections(connections))

        it("should throw error when validating uuid type with a length provided only for mariadb", async () => {
            const expectedError = new TypeORMError(
                `Column badUuid of Entity BadUuidEntity does not support length property.`,
            )

            await createTestingConnections({
                entities: [BadUuidEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mariadb"],
            })
                .then((conns) => {
                    if (
                        conns.some(
                            (conn) =>
                                getSupportedTypesMap(
                                    conn.options.type,
                                    conn.driver.version ?? "0.0.0",
                                ).allowsUuidType,
                        )
                    ) {
                        expect.fail(
                            null,
                            null,
                            "creating the connection did not reject with an error",
                        )
                    }
                })
                .catch((err) => {
                    expect(err.message).to.equal(expectedError.message)
                })

            await createTestingConnections({
                entities: [BadUuidEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql"],
            }).catch(() => {
                expect.fail(
                    null,
                    null,
                    "creating the connection threw an unexpected error",
                )
            })
        })

        it("should throw error when validating inet4 type with a length provided only for mariadb", async () => {
            const expectedError = new TypeORMError(
                `Column badinet4 of Entity BadInet4Entity does not support length property.`,
            )

            await createTestingConnections({
                entities: [BadInet4Entity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mariadb"],
            })
                .then((conns) => {
                    if (
                        conns.some(
                            (conn) =>
                                getSupportedTypesMap(
                                    conn.options.type,
                                    conn.driver.version ?? "0.0.0",
                                ).allowsInet4Type,
                        )
                    ) {
                        expect.fail(
                            null,
                            null,
                            "creating the connection did not reject with an error",
                        )
                    }
                })
                .catch((err) => {
                    expect(err.message).to.equal(expectedError.message)
                })

            connections = await createTestingConnections({
                entities: [BadInet4Entity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql"],
            }).catch(() => {
                expect.fail(
                    null,
                    null,
                    "creating the connection threw an unexpected error",
                )
            })
        })

        it("should throw error when validating inet6 type with a length provided", async () => {
            const expectedError = new TypeORMError(
                `Column badinet6 of Entity BadInet6Entity does not support length property.`,
            )

            await createTestingConnections({
                entities: [BadInet6Entity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mariadb"],
            })
                .then((conns) => {
                    if (
                        conns.some(
                            (conn) =>
                                getSupportedTypesMap(
                                    conn.options.type,
                                    conn.driver.version ?? "0.0.0",
                                ).allowsInet6Type,
                        )
                    ) {
                        expect.fail(
                            null,
                            null,
                            "creating the connection did not reject with an error",
                        )
                    }
                })
                .catch((err) => {
                    expect(err.message).to.equal(expectedError.message)
                })

            connections = await createTestingConnections({
                entities: [BadInet6Entity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql"],
            }).catch(() => {
                expect.fail(
                    null,
                    null,
                    "creating the connection threw an unexpected error",
                )
            })
        })
    })
})
