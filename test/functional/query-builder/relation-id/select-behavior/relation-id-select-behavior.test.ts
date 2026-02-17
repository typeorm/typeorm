import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Group } from "./entity/Group"

describe("query-builder > #11483 relation-id > select-behavior", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should NOT load @RelationId when it is NOT explicitly selected", () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = connection.getRepository(User)
                const groupRepository = connection.getRepository(Group)

                const numUsers = 10
                const numGroups = 2
                const membershipsPerGroup = 5

                const users: User[] = []
                for (let i = 0; i < numUsers; i++) {
                    users.push(
                        await userRepository.save({ name: `User ${i + 1}` }),
                    )
                }

                for (let i = 0; i < numGroups; i++) {
                    const group = await groupRepository.save({
                        name: `Group ${i + 1}`,
                    })
                    group.members = users.slice(0, membershipsPerGroup)
                    await groupRepository.save(group)
                }

                const foundGroups = await groupRepository.find({
                    select: ["id"],
                })

                expect(foundGroups.length).to.be.equal(numGroups)

                foundGroups.forEach((group) => {
                    expect(group).to.have.property("id")
                    expect(Object.keys(group).length).to.be.equal(1)
                    expect(group).to.not.have.property("memberIds")
                })
            }),
        ))

    it("should load @RelationId when it IS explicitly selected", () =>
        Promise.all(
            connections.map(async (connection) => {
                const groupRepository = connection.getRepository(Group)
                const userRepository = connection.getRepository(User)

                const users: User[] = []
                for (let i = 0; i < 5; i++) {
                    users.push(
                        await userRepository.save({ name: `User ${i + 1}` }),
                    )
                }
                const group = await groupRepository.save({ name: "Group 1" })
                group.members = users
                await groupRepository.save(group)

                const foundGroups = await groupRepository
                    .createQueryBuilder("grp")
                    .select("grp.id")
                    .loadRelationIdAndMap("grp.memberIds", "grp.members")
                    .getMany()

                expect(foundGroups.length).to.be.equal(1)
                foundGroups.forEach((group) => {
                    expect(group).to.have.property("id")
                    expect(group).to.have.property("memberIds")
                    expect(group.memberIds).to.be.an("array")
                    expect(group.memberIds).to.have.length(5)
                })
            }),
        ))

    it("should load @RelationId when all columns are explicitly selected", () =>
        Promise.all(
            connections.map(async (connection) => {
                const groupRepository = connection.getRepository(Group)
                const userRepository = connection.getRepository(User)

                const users: User[] = []
                for (let i = 0; i < 5; i++) {
                    users.push(
                        await userRepository.save({ name: `User ${i + 1}` }),
                    )
                }
                const group = await groupRepository.save({ name: "Group 1" })
                group.members = users
                await groupRepository.save(group)

                // Select all columns explicitly
                const foundGroups = await groupRepository
                    .createQueryBuilder("grp")
                    .select(["grp.id", "grp.name"])
                    .getMany()

                expect(foundGroups).to.have.length(1)
                foundGroups.forEach((group) => {
                    expect(group).to.have.property("id")
                    expect(group).to.have.property("name")
                    expect(group).to.have.property("memberIds")
                    expect(group.memberIds).to.be.an("array")
                    expect(group.memberIds).to.have.length(5)
                })
            }),
        ))
})
