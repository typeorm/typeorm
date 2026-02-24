import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Player } from "./entity/Player"
import { Group } from "./entity/Group"

describe("github issues > #401 special keywords should be escaped in join queries", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should escape 'group' keyword properly", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const group = new Group()
                group.name = "about players"
                await connection.manager.save(group)

                const player = new Player()
                player.email = "player@gmail.com"
                player.group = group
                await connection.manager.save(player)

                const loadedPlayer = await connection
                    .getRepository(Player)
                    .createQueryBuilder("player")
                    .leftJoinAndSelect("player.group", "group")
                    .where("player.email = :email", {
                        email: "player@gmail.com",
                    })
                    .getOne()

                expect(loadedPlayer).to.be.eql({
                    email: "player@gmail.com",
                    group: {
                        id: 1,
                        name: "about players",
                    },
                })
            }),
        ))
})
