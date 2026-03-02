import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"

import { TournamentGraph } from "./entity/TournamentGraph"
import { SquadBilliardsTournament } from "./entity/SquadBilliardsTournament"

describe("other issues > using nested child entities", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should insert without error", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const squadBilliardsTournament = new SquadBilliardsTournament({
                    name: "Squad Tournament",
                })

                await connection.manager.save(squadBilliardsTournament)
                const tournamentGraph = new TournamentGraph()

                tournamentGraph.tournament = squadBilliardsTournament

                await connection.manager.save(tournamentGraph)
            }),
        ))
})
