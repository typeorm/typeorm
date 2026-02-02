import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Animal } from "./entity/Animal"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { VersionUtils } from "../../../src/util/VersionUtils"

describe('github issues > #7235 Use "INSERT...RETURNING" in MariaDB.', () => {
    const runOnSpecificVersion =
        (version: string, fn: (dataSource: DataSource) => Promise<void>) =>
        async () =>
            Promise.all(
                connections.map(async (connection) => {
                    const result = await connection.query(
                        `SELECT VERSION() AS \`version\``,
                    )
                    const dbVersion = result[0]["version"]
                    if (VersionUtils.isGreaterOrEqual(dbVersion, version)) {
                        await fn(connection)
                    }
                }),
            )

    let connections: DataSource[]

    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it(
        "should allow `DELETE...RETURNING` on MariaDB >= 10.0.5",
        runOnSpecificVersion("10.0.5", async (connection: DataSource) => {
            const animalRepository = connection.getRepository(Animal)

            await animalRepository
                .createQueryBuilder()
                .insert()
                .values([{ name: "Cat" }, { name: "Wolf" }])
                .execute()

            const deleteCat = await animalRepository
                .createQueryBuilder()
                .delete()
                .where({ name: "Cat" })
                .returning(["id", "name"])
                .execute()
            expect(deleteCat.raw[0]).to.deep.equal({ id: 1, name: "Cat" })
            const deleteWolf = await animalRepository
                .createQueryBuilder()
                .delete()
                .where({ name: "Wolf" })
                .returning("name")
                .execute()
            expect(deleteWolf.raw[0]).to.deep.equal({ name: "Wolf" })
        }),
    )

    it(
        "should allow `INSERT...RETURNING` on MariaDB >= 10.5.0",
        runOnSpecificVersion("10.5.0", async (connection: DataSource) => {
            const animalRepository = connection.getRepository(Animal)
            const insertDogFox = await animalRepository
                .createQueryBuilder()
                .insert()
                .values([{ name: "Dog" }, { name: "Fox" }])
                .returning("name")
                .execute()
            expect(insertDogFox.raw).to.deep.equal([
                { name: "Dog" },
                { name: "Fox" },
            ])

            const insertUnicorn = await animalRepository
                .createQueryBuilder()
                .insert()
                .values({ name: "Unicorn" })
                .returning(["id", "name"])
                .execute()
            expect(insertUnicorn.raw[0]).to.deep.equal({
                id: 3,
                name: "Unicorn",
            })
        }),
    )
})
