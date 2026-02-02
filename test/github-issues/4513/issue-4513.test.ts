import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"

describe("github issues > #4513 CockroachDB support for onConflict", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["cockroachdb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should insert if no conflict", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "example"
                user1.email = "example@example.com"
                user1.age = 30

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user1)
                    .execute()

                const user2 = new User()
                user2.name = "example2"
                user2.email = "example2@example.com"
                user2.age = 42

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user2)
                    .onConflict(`("name", "email") DO NOTHING`)
                    .execute()

                await connection.manager
                    .find(User)
                    .should.eventually.have.lengthOf(2)
            }),
        ))

    it("should update on conflict with do update", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "example"
                user1.email = "example@example.com"
                user1.age = 30

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user1)
                    .execute()

                const user2 = new User()
                user2.name = "example"
                user2.email = "example@example.com"
                user2.age = 42

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user2)
                    .onConflict(
                        `("name", "email") DO UPDATE SET age = EXCLUDED.age`,
                    )
                    .execute()

                await connection.manager
                    .findOneBy(User, {
                        name: "example",
                        email: "example@example.com",
                    })
                    .should.eventually.be.eql({
                        name: "example",
                        email: "example@example.com",
                        age: 42,
                    })
            }),
        ))

    it("should not update on conflict with do nothing", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "example"
                user1.email = "example@example.com"
                user1.age = 30

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user1)
                    .execute()

                const user2 = new User()
                user2.name = "example"
                user2.email = "example@example.com"
                user2.age = 42

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user2)
                    .onConflict(`("name", "email") DO NOTHING`)
                    .execute()

                await connection.manager
                    .findOneBy(User, {
                        name: "example",
                        email: "example@example.com",
                    })
                    .should.eventually.be.eql({
                        name: "example",
                        email: "example@example.com",
                        age: 30,
                    })
            }),
        ))

    it("should update with orUpdate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "example"
                user1.email = "example@example.com"
                user1.age = 30

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user1)
                    .execute()

                const user2 = new User()
                user2.name = "example"
                user2.email = "example@example.com"
                user2.age = 42

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(User)
                    .values(user2)
                    .orUpdate(["age"], ["name", "email"])
                    .execute()

                await connection.manager
                    .findOneBy(User, {
                        name: "example",
                        email: "example@example.com",
                    })
                    .should.eventually.be.eql({
                        name: "example",
                        email: "example@example.com",
                        age: 42,
                    })
            }),
        ))
})
