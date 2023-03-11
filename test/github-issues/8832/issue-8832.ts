import "../../utils/test-setup"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index"
import { expect } from "chai"
import { User } from "../8832/entity/User"
import { VersionUtils } from "../../../src/util/VersionUtils"

describe("github issues > #8832 Add uuid, inet4, and inet6 types for mariadb", () => {
    let connections: DataSource[]

    const newUser: User = {
        uuid: "ceb2897c-a1cf-11ed-8dbd-040300000000",
        inet4: "192.0.2.146",
        inet6: "2001:0db8:0000:0000:0000:ff00:0042:8329",
    }

    const expectedInet6 = "2001:db8::ff00:42:8329";

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
    after(() => closeTestingConnections(connections))

    it("should create table with uuid type set to column for relevant mariadb versions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)

                const savedUser = await userRepository.save(newUser)

                const foundUser = await userRepository.find({
                    where: { id: savedUser.id },
                })
                const {
                    options: { type },
                    driver: { version = "0.0.0" },
                } = connection

                const { allowsUuidType, allowsInet4Type, allowsInet6Type } = {
                    allowsUuidType: type === "mariadb" &&
                    VersionUtils.isGreaterOrEqual(version, "10.7.0"),
                    allowsInet4Type: type === "mariadb" &&
                    VersionUtils.isGreaterOrEqual(version, "10.10.0"),
                    allowsInet6Type: type === "mariadb" &&
                    VersionUtils.isGreaterOrEqual(version, "10.5.0")
                }

                expect(foundUser[0].uuid).to.deep.equal(newUser.uuid)
                expect(foundUser[0].inet4).to.deep.equal(newUser.inet4)
                expect(foundUser[0].inet6).to.deep.equal(
                    allowsInet6Type ? expectedInet6 : newUser.inet6,
                )
                expect(foundUser[0].anotherUuid).to.not.be.undefined

                const columnTypes: { COLUMN_NAME: string, DATA_TYPE: string}[] = await connection.query(`
                    SELECT 
                        COLUMN_NAME,
                        DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE 
                        TABLE_NAME = ? 
                        AND COLUMN_NAME IN (?, ?, ?, ?)
                `, ["user", "id", "uuid", "inet4", "inet6", "anotherUuid"])
                const expectedColumnTypes: Record<string, string> = {
                    "id": "int",
                    "uuid": allowsUuidType ? "uuid" : "varchar",
                    "inet4": allowsInet4Type ? "inet4" : "varchar",
                    "inet6": allowsInet6Type ? "inet6" : "varchar",
                    "anotherUuid": allowsUuidType ? "uuid" : "varchar",
                }

                columnTypes.forEach(({ COLUMN_NAME, DATA_TYPE }) => {
                    expect(DATA_TYPE).to.equal(expectedColumnTypes[COLUMN_NAME]);
                })
            }),
        ))
})
