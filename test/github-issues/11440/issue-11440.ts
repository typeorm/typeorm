import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #11440", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "aurora-postgres"], // since the issue is for postgres
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should use table or alias name during upsert or doUpdate when both schema name and skipUpdateIfNoValuesChanged supplied", async () => {
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save([
                    {
                        id: 1,
                        title: "First Post",
                    },
                    {
                        id: 2,
                        title: "Second Post",
                    },
                    {
                        id: 3,
                        title: "Third Post",
                    },
                ])

                // upsert does not cast alias as class name
                await repository.upsert(
                    [
                        {
                            id: 1,
                            title: "First Post",
                        },
                        {
                            id: 2,
                            title: "Second Post UPSERTED",
                        },
                    ],
                    {
                        conflictPaths: ["id"],
                        upsertType: "on-conflict-do-update",
                        skipUpdateIfNoValuesChanged: true,
                    },
                )

                const query = repository
                    .createQueryBuilder()
                    .insert()
                    .values([
                        {
                            id: 1,
                            title: "First Post",
                        },
                        {
                            id: 3,
                            title: "Third Post OR_UPDATED",
                        },
                    ])
                    .orUpdate(["title"], ["id"], {
                        skipUpdateIfNoValuesChanged: true,
                    })

                // orUpdate cast alias as class name
                expect(query.getSql()).to.equal(
                    `INSERT INTO "typeorm_test"."post" AS "Post"("id", "title") ` +
                        `VALUES ($1, $2), ($3, $4) ` +
                        `ON CONFLICT ( "id" ) DO UPDATE ` +
                        `SET "title" = EXCLUDED."title" ` +
                        `WHERE ("Post"."title" IS DISTINCT FROM EXCLUDED."title")`,
                )
                await query.execute()

                const posts = await repository.find({
                    order: { id: "ASC" },
                })

                expect(posts).to.deep.equal([
                    {
                        id: 1,
                        title: "First Post",
                    },
                    {
                        id: 2,
                        title: "Second Post UPSERTED",
                    },
                    {
                        id: 3,
                        title: "Third Post OR_UPDATED",
                    },
                ])
            }),
        )
    })
})
