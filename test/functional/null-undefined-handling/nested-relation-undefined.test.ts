import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntitySchema } from "../../../src/entity-schema/EntitySchema"
import { expect } from "chai"

describe("invalidWhereValuesBehavior on nested relation (issue #11818)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [
                    new EntitySchema<{ id: number; uuid: string }>({
                        name: "A",
                        columns: {
                            id: { type: Number, primary: true },
                            uuid: { type: String },
                        },
                        relations: {
                            b: {
                                target: "B",
                                type: "many-to-one",
                                joinColumn: { name: "b_id" },
                            },
                        },
                    }),
                    new EntitySchema<{ id: number; uuid: string }>({
                        name: "B",
                        columns: {
                            id: { type: Number, primary: true },
                            uuid: { type: String },
                        },
                    }),
                ],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("throws when a nested relation has all-undefined properties and behavior is 'throw'", () =>
        Promise.all(
            connections.map(async (connection) => {
                connection.options.invalidWhereValuesBehavior = {
                    undefined: "throw",
                    null: "throw",
                }

                const aRepo = connection.getRepository("A")

                await expect(
                    aRepo.findOne({
                        where: {
                            uuid: "valid-uuid",
                            b: { uuid: undefined },
                        },
                        relations: { b: true },
                    }),
                ).to.be.rejectedWith(/Undefined value.*b\.uuid/)
            }),
        ))

    it("does NOT throw when the nested relation has all-undefined and behavior is the default ('ignore')", () =>
        Promise.all(
            connections.map(async (connection) => {
                // default — no options.invalidWhereValuesBehavior set
                const aRepo = connection.getRepository("A")

                // sanity check: just exercises the relation branch path,
                // not asserting a specific row because the DB is empty.
                const row = await aRepo.findOne({
                    where: { uuid: "valid-uuid", b: { uuid: undefined } },
                    relations: { b: true },
                })
                expect(row).to.equal(null)
            }),
        ))
})