import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ClientRow } from "./entity/ClientRow"
import { ClientView } from "./entity/ClientView"
import { Group } from "./entity/Group"

describe("github issues > #12330 One-to-many view relation with query load strategy", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Group, ClientRow, ClientView],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not cross-join one-to-many view relations when using relationLoadStrategy query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const groupRepo = dataSource.getRepository(Group)
                const rowRepo = dataSource.getRepository(ClientRow)

                await groupRepo.save(groupRepo.create({ id: 1 }))
                await groupRepo.save(groupRepo.create({ id: 2 }))

                await rowRepo.save(
                    rowRepo.create([
                        { groupId: 1 },
                        { groupId: 1 },
                        { groupId: 2 },
                    ]),
                )

                const joinStrategy = await groupRepo.find({
                    relations: { currentClients: true },
                    relationLoadStrategy: "join",
                    order: { id: "ASC" },
                })

                const queryStrategy = await groupRepo.find({
                    relations: { currentClients: true },
                    relationLoadStrategy: "query",
                    order: { id: "ASC" },
                })

                expect(joinStrategy).to.have.length(2)
                expect(queryStrategy).to.have.length(2)

                expect(
                    joinStrategy[0].currentClients.map((c) => c.id).sort(),
                ).to.deep.equal(
                    queryStrategy[0].currentClients.map((c) => c.id).sort(),
                )
                expect(
                    joinStrategy[1].currentClients.map((c) => c.id).sort(),
                ).to.deep.equal(
                    queryStrategy[1].currentClients.map((c) => c.id).sort(),
                )

                expect(queryStrategy[0].currentClients).to.have.length(2)
                expect(queryStrategy[1].currentClients).to.have.length(1)
                expect(
                    queryStrategy[0].currentClients.every(
                        (c) => c.groupId === 1,
                    ),
                ).to.equal(true)
                expect(
                    queryStrategy[1].currentClients.every(
                        (c) => c.groupId === 2,
                    ),
                ).to.equal(true)
            }),
        ))
})
