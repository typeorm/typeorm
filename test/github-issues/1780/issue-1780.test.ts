import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #1780 Support for insertion ignore on duplicate error", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [User],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "mariadb", "postgres", "cockroachdb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))
    const user1 = new User()
    user1.first_name = "John"
    user1.last_name = "Lenon"
    user1.is_updated = "no"
    const user2 = new User()
    user2.first_name = "John"
    user2.last_name = "Lenon"
    user2.is_updated = "yes"
    // let data = [user1, user2];
    // Bulk insertion with duplicated data through same query with duplicate error exception is not supported in PostgreSQL
    // https://doxygen.postgresql.org/nodeModifyTable_8c_source.html : Line 1356
    it("should save one row without duplicate error in MySQL/MariaDB", () =>
        Promise.all(
            connections.map(async (connection) => {
                try {
                    if (DriverUtils.isMySQLFamily(connection.driver)) {
                        const UserRepository =
                            connection.manager.getRepository(User)
                        // ignore while insertion duplicated row
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User)
                            .values(user1)
                            .execute()
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User)
                            .values(user2)
                            .execute()
                        const loadedUser_1 = await UserRepository.find()
                        expect(loadedUser_1).not.to.be.eql([])
                        loadedUser_1.length.should.be.equal(1)
                        // remove all rows
                        await UserRepository.remove(loadedUser_1)
                        const loadedUser_2 = await UserRepository.find()
                        expect(loadedUser_2).to.be.eql([])
                        // update while insertion duplicated row
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orUpdate(["is_updated"])
                            .into(User)
                            .values(user1)
                            .execute()
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orUpdate(["is_updated"])
                            .into(User)
                            .values(user2)
                            .execute()
                        const loadedUser_3 = await UserRepository.find()
                        expect(loadedUser_3).not.to.be.eql([])
                        loadedUser_3.length.should.be.equal(1)
                        expect(loadedUser_3[0]).to.deep.include({
                            first_name: "John",
                            last_name: "Lenon",
                            is_updated: "yes",
                        })
                    }
                } catch (err) {
                    throw new Error(err)
                }
            }),
        ))
    it("should save one row without duplicate error in PostgreSQL/CockroachDB", () =>
        Promise.all(
            connections.map(async (connection) => {
                try {
                    if (DriverUtils.isPostgresFamily(connection.driver)) {
                        const UserRepository =
                            connection.manager.getRepository(User)
                        // ignore while insertion duplicated row
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User)
                            .values(user1)
                            .execute()
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orIgnore()
                            .into(User)
                            .values(user2)
                            .execute()
                        const loadedUser_1 = await UserRepository.find()
                        expect(loadedUser_1).not.to.be.eql([])
                        loadedUser_1.length.should.be.equal(1)
                        // remove all rows
                        await UserRepository.remove(loadedUser_1)
                        const loadedUser_2 = await UserRepository.find()
                        expect(loadedUser_2).to.be.eql([])
                        // update while insertion duplicated row via unique column
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .into(User)
                            .values(user1)
                            .execute()
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .into(User)
                            .orUpdate(["is_updated"], ["first_name"])
                            .values(user2)
                            .execute()
                        const loadedUser_3 = await UserRepository.find()
                        expect(loadedUser_3).not.to.be.eql([])
                        loadedUser_3.length.should.be.equal(1)
                        expect(loadedUser_3[0]).to.deep.include({
                            first_name: "John",
                            last_name: "Lenon",
                            is_updated: "yes",
                        })

                        await UserRepository.remove(loadedUser_3)
                        const loadedUser_4 = await UserRepository.find()
                        expect(loadedUser_4).to.be.eql([])
                        // update while insertion duplicated row via unique's constraint name
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .into(User)
                            .values(user1)
                            .execute()
                        await UserRepository.createQueryBuilder()
                            .insert()
                            .orUpdate(["is_updated"], "unique_first_name")
                            .setParameter("is_updated", user2.is_updated)
                            .into(User)
                            .values(user2)
                            .execute()
                        const loadedUser = await UserRepository.find()
                        expect(loadedUser).not.to.be.eql([])
                        loadedUser.length.should.be.equal(1)
                        expect(loadedUser[0]).to.deep.include({
                            first_name: "John",
                            last_name: "Lenon",
                            is_updated: "yes",
                        })
                    }
                } catch (err) {
                    throw new Error(err)
                }
            }),
        ))
})
