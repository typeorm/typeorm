import "reflect-metadata"
import { expect } from "chai"

import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TypeORMError } from "../../../src/error/TypeORMError"

import { Author } from "./entity/Author"
import { Post } from "./entity/Post"

describe("github issues > #12712 findBy with a primitive under a relation key silently returns all rows (no WHERE clause)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should throw when a primitive is used under a relation key instead of returning all rows", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const a1 = await manager.save(Author, { name: "a1" })
                const a2 = await manager.save(Author, { name: "a2" })
                await manager.save(Post, [
                    { title: "a1-post-1", author: a1 },
                    { title: "a1-post-2", author: a1 },
                    { title: "a2-post-1", author: a2 },
                ])

                // The nested form is the documented API and must keep working.
                const nestedPosts = await manager.findBy(Post, {
                    author: { id: a1.id },
                })
                expect(nestedPosts.map((p) => p.title).sort()).to.be.eql([
                    "a1-post-1",
                    "a1-post-2",
                ])

                // A primitive under a relation key must throw — it used to
                // silently generate a join with no WHERE clause and return
                // every row (a multi-tenant data leak). The type system
                // rejects this input, so cast to any to exercise the runtime
                // guard that protects JS callers.
                await expect(
                    manager.findBy(Post, { author: a1.id } as any),
                ).to.be.rejectedWith(TypeORMError)
                await expect(
                    manager.findOneBy(Post, { author: a1.id } as any),
                ).to.be.rejectedWith(TypeORMError)
                await expect(
                    manager.countBy(Post, { author: a1.id } as any),
                ).to.be.rejectedWith(TypeORMError)
                await expect(
                    manager.existsBy(Post, { author: a1.id } as any),
                ).to.be.rejectedWith(TypeORMError)

                // `author: true` is the documented join shorthand and must
                // keep working: every post has an author, so all rows return.
                const joinedPosts = await manager.findBy(Post, {
                    author: true,
                })
                expect(joinedPosts).to.have.length(3)
            }),
        ))
})
