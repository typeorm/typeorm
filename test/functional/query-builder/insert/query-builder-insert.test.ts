import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Photo } from "./entity/Photo"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("query builder > insert", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should perform insertion correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user)
                    .execute()

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values({
                        name: "Dima Zotov",
                    })
                    .execute()

                await connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .insert()
                    .values({ name: "Muhammad Mirzoev" })
                    .execute()

                const users = await connection.getRepository(User).find({
                    order: {
                        id: "ASC",
                    },
                })
                users.should.be.eql([
                    { id: 1, name: "Alex Messer", memberId: null },
                    { id: 2, name: "Dima Zotov", memberId: null },
                    { id: 3, name: "Muhammad Mirzoev", memberId: null },
                ])
            }),
        ))

    it("should perform bulk insertion correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                // it is skipped for SAP because it does not support bulk insertion
                if (connection.driver.options.type === "sap") {
                    return
                }

                // Oracle does not support automatic ID generation for bulk inserts, so we manually assign IDs to avoid issues.
                const isOracle = connection.driver.options.type === "oracle"
                const values: Partial<User>[] = [
                    { name: "Umed Khudoiberdiev", memberId: 1 },
                    {
                        name: "Bakhrom Baubekov",
                        memberId: null,
                    } as unknown as Partial<User>, // try setting something NULL (see issue #11362)
                    { name: "Bakhodur Kandikov", memberId: 3 },
                ].map((user, index) =>
                    isOracle ? { id: index + 1, ...user } : user,
                )

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(values)
                    .execute()

                const users = await connection.getRepository(User).find({
                    order: {
                        id: "ASC",
                    },
                })
                users.should.be.eql([
                    { id: 1, name: "Umed Khudoiberdiev", memberId: 1 },
                    { id: 2, name: "Bakhrom Baubekov", memberId: null },
                    { id: 3, name: "Bakhodur Kandikov", memberId: 3 },
                ])
            }),
        ))

    it("should be able to use sql functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values({
                        name: () =>
                            connection.driver.options.type === "mssql"
                                ? "SUBSTRING('Dima Zotov', 1, 4)"
                                : "SUBSTR('Dima Zotov', 1, 4)",
                    })
                    .execute()

                const loadedUser1 = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Dima" })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima")
            }),
        ))

    it("should be able to insert entities with different properties set even inside embeds", () =>
        Promise.all(
            connections.map(async (connection) => {
                // this test is skipped for sqlite based drivers because it does not support DEFAULT values in insertions,
                // also it is skipped for SAP because it does not support bulk insertion
                if (
                    DriverUtils.isSQLiteFamily(connection.driver) ||
                    connection.driver.options.type === "sap"
                ) {
                    return
                }

                // Oracle does not support automatic ID generation for bulk inserts, so we manually assign IDs to avoid issues.
                const isOracle = connection.driver.options.type === "oracle"
                const values: Partial<Photo>[] = [
                    {
                        url: "1.jpg",
                        counters: {
                            likes: 1,
                            favorites: 1,
                            comments: 1,
                        },
                    },
                    {
                        url: "2.jpg",
                    },
                ].map((photo, index) =>
                    isOracle ? { id: index + 1, ...photo } : photo,
                )

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Photo)
                    .values(values)
                    .execute()

                const loadedPhoto1 = await connection
                    .getRepository(Photo)
                    .findOneBy({ url: "1.jpg" })
                expect(loadedPhoto1).to.exist
                loadedPhoto1!.should.be.eql({
                    id: 1,
                    url: "1.jpg",
                    counters: {
                        likes: 1,
                        favorites: 1,
                        comments: 1,
                    },
                })

                const loadedPhoto2 = await connection
                    .getRepository(Photo)
                    .findOneBy({ url: "2.jpg" })
                expect(loadedPhoto2).to.exist
                loadedPhoto2!.should.be.eql({
                    id: 2,
                    url: "2.jpg",
                    counters: {
                        likes: 1,
                        favorites: null,
                        comments: 0,
                    },
                })
            }),
        ))
})
