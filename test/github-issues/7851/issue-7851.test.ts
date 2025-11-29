import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/user"
import { Message } from "./entity/message"

describe("github issues > #7851 Updating (using save method) a ManyToOne relation sets the object.relation_id to null", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mysql"],
            entities: [User, Message],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should update the message.user_id to the new value", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)
                const messageRepository = connection.getRepository(Message)

                const user1ID = Buffer.from([
                    135, 114, 221, 160, 230, 218, 17, 234, 175, 15, 4, 237, 51,
                    12, 208, 0,
                ])
                const user2ID = Buffer.from([
                    50, 114, 221, 160, 230, 218, 17, 234, 175, 15, 4, 237, 51,
                    12, 208, 0,
                ])
                const messageID = Buffer.from([
                    64, 114, 221, 160, 230, 218, 17, 234, 175, 15, 4, 237, 51,
                    12, 208, 0,
                ])

                // Inserting users, works fine

                const user1: User = {
                    id: user1ID,
                }

                const user2: User = {
                    id: user2ID,
                }

                await userRepository.save([user1, user2])

                // Inserting message : works fine

                const message: Message = {
                    id: messageID,
                    sender: user1,
                }

                await messageRepository.save(message)

                // Updating message.sender

                message.sender = user2
                await messageRepository.save(message)

                const savedMessage = await messageRepository
                    .createQueryBuilder("Message")
                    .leftJoinAndMapOne(
                        "Message.sender",
                        "Message.sender",
                        "sender",
                    )
                    .where("Message.id = :id", { id: messageID })
                    .getOneOrFail()

                expect(savedMessage.sender).to.be.instanceOf(User)
                expect(savedMessage.sender.id).to.be.eql(user2ID)
            }),
        ))
})
