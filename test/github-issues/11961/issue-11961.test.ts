import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { User } from "./entity/User"
import { UserRole } from "./entity/UserRole"

describe("github issues > #11961 OneToMany select returns only the first relation row instead of all related entities", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should return all related entities when using select with OneToMany relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)
                const userRoleRepository = connection.getRepository(UserRole)

                const user = new User()
                user.username = "alice"
                await userRepository.save(user)

                const role1 = new UserRole()
                role1.user = user
                role1.roleId = "roleA"
                await userRoleRepository.save(role1)

                const role2 = new UserRole()
                role2.user = user
                role2.roleId = "roleB"
                await userRoleRepository.save(role2)

                const users = await connection
                    .createQueryBuilder(User, "user")
                    .leftJoinAndSelect("user.userRoles", "userRole")
                    .select(["user.id", "user.username", "userRole.roleId"])
                    .getMany()

                expect(users).to.have.lengthOf(1)
                expect(users[0].userRoles).to.have.lengthOf(2)
                const roleIds = users[0].userRoles.map((r) => r.roleId)
                expect(roleIds).to.include("roleA")
                expect(roleIds).to.include("roleB")
            }),
        ))
})
