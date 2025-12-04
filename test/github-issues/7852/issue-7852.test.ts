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
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/user"
import { UsersObject } from "./entity/usersObject"

describe("github issues > #7852 saving a ManyToMany relation tries to insert (DEFAULT, entity2.id) instead of (entity1.id, entity2.id), when id is Buffer", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mysql"],
            entities: [User, UsersObject],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should insert (entity1.id, entity2.id)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)
                const usersObjectRepository =
                    connection.getRepository(UsersObject)

                // Save one user
                const userId = Buffer.from([
                    135, 114, 221, 160, 230, 218, 17, 234, 175, 15, 4, 237, 51,
                    12, 208, 0,
                ])
                const userEntity = new User()
                userEntity.id = userId
                userEntity.objects = []
                await userRepository.save(userEntity)

                // Save on object
                const ObjectId = 1
                const objectEntity = new UsersObject()
                objectEntity.id = ObjectId
                await usersObjectRepository.save(objectEntity)

                // Updating using save method
                userEntity.objects = [objectEntity]
                await userRepository.save(userEntity)

                const savedUser = await userRepository
                    .createQueryBuilder("User")
                    .leftJoinAndMapMany(
                        "User.objects",
                        "User.objects",
                        "objects",
                    )
                    .getOneOrFail()

                expect(savedUser.objects.length).to.be.eql(1)
                expect(savedUser.objects[0]).to.be.instanceOf(UsersObject)
                expect(savedUser.objects[0].id).to.be.eql(ObjectId)
            }),
        ))
})
