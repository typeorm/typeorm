import "reflect-metadata"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Person } from "./entity/person"
import { Note } from "./entity/note"

describe("github issues > #10530 Upsert lazy relations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                // use for manual validation
                // logging: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should upsert lazy relations with promise", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repoPerson = connection.getRepository(Person)
                const repoNote = connection.getRepository(Note)

                const person = await repoPerson.save({ externalId: "person" })

                await repoNote.insert({ externalId: "note" })

                await repoNote.upsert(
                    {
                        externalId: "note",
                        owner: Promise.resolve(person),
                    },
                    {
                        conflictPaths: {
                            externalId: true,
                        },
                        skipUpdateIfNoValuesChanged: true,
                    },
                )

                const note = await repoNote.findOneOrFail({
                    where: { externalId: "note" },
                })
                const noteOwner = await note.owner
                noteOwner.externalId.should.be.equal("person")
            }),
        ))

    it("should upsert lazy relations without promise", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repoPerson = connection.getRepository(Person)
                const repoNote = connection.getRepository(Note)

                const person = await repoPerson.save({ externalId: "person" })

                await repoNote.insert({ externalId: "note" })

                await repoNote.upsert(
                    {
                        externalId: "note",
                        owner: person,
                    },
                    {
                        conflictPaths: {
                            externalId: true,
                        },
                        skipUpdateIfNoValuesChanged: true,
                    },
                )

                const note = await repoNote.findOneOrFail({
                    where: { externalId: "note" },
                })
                const noteOwner = await note.owner
                noteOwner.externalId.should.be.equal("person")
            }),
        ))
})
