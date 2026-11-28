import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { OracleDriver } from "../../../../src/driver/oracle/OracleDriver"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Photo } from "../soft-delete/entity/Photo"
import { User } from "../soft-delete/entity/User"
import { Post } from "./entity/Post"

// Regression for #13077.
describe("query builder > Oracle update returning", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, User, Photo],
            enabledDrivers: ["oracle"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const cases = [
        {
            name: "a single entity",
            select: (first: Post, _second: Post): Post | Post[] => first,
            redirect: false,
            raw: [2],
            versions: [2, 5],
            generatedMaps: 1,
        },
        {
            name: "a batch of entities",
            select: (first: Post, second: Post): Post | Post[] => [
                second,
                first,
            ],
            redirect: false,
            raw: [2, 6],
            versions: [2, 6],
            generatedMaps: 2,
        },
        {
            // the row updated is not the entity supplied, so the entity must keep its own values
            name: "an entity whose where clause was replaced",
            select: (first: Post, _second: Post): Post | Post[] => first,
            redirect: true,
            raw: [6],
            versions: [1, 5],
            generatedMaps: 1,
        },
    ]

    for (const testCase of cases) {
        it(`preserves custom output binds and reloads ${testCase.name}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Post)
                    const [first, second] = await repository.save([
                        { title: "first", version: 1 },
                        { title: "second", version: 5 },
                    ])
                    const oracle = (dataSource.driver as OracleDriver).oracle
                    const query = repository
                        .createQueryBuilder()
                        .update()
                        .set({ title: "after" })
                        .whereEntity(testCase.select(first, second))
                        .returning('"version" INTO :version')
                        .setParameter("version", {
                            type: oracle.NUMBER,
                            dir: oracle.BIND_OUT,
                        })

                    if (testCase.redirect) query.where({ id: second.id })
                    const result = await query.execute()

                    // raw keeps the driver's native output binds
                    expect(result.raw).to.have.length(1)
                    expect(result.raw[0]).to.have.members(testCase.raw)

                    // entities are refreshed from the database, matched by id
                    expect(result.generatedMaps).to.have.length(
                        testCase.generatedMaps,
                    )
                    expect([first.version, second.version]).to.deep.equal(
                        testCase.versions,
                    )
                    if (!testCase.redirect) {
                        for (const entity of [first, second]) {
                            const reloaded = await repository.findOneByOrFail({
                                id: entity.id,
                            })
                            expect(entity.version).to.equal(reloaded.version)
                            expect(entity.updateDate).to.deep.equal(
                                reloaded.updateDate,
                            )
                        }
                    }
                }),
            ))
    }

    it("preserves custom output binds and does not reload the entity if updateEntity is set to false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                const post = await repository.save({ title: "first" })
                const originalDate = post.updateDate
                const oracle = (dataSource.driver as OracleDriver).oracle

                const result = await repository
                    .createQueryBuilder()
                    .update()
                    .set({ title: "after" })
                    .whereEntity(post)
                    .updateEntity(false)
                    .returning('"version" INTO :version')
                    .setParameter("version", {
                        type: oracle.NUMBER,
                        dir: oracle.BIND_OUT,
                    })
                    .execute()

                expect(result.raw).to.deep.equal([[2]])
                expect(result.generatedMaps).to.deep.equal([])
                expect(post.version).to.equal(1)
                expect(post.updateDate).to.deep.equal(originalDate)
            }),
        ))

    for (const restore of [false, true]) {
        it(`preserves custom output binds and reloads the entity on ${restore ? "restore" : "soft delete"}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(User)
                    const user = await repository.save({
                        name: "Alex",
                        likesCount: 0,
                    })
                    const oracle = (dataSource.driver as OracleDriver).oracle

                    if (restore) {
                        await repository
                            .createQueryBuilder()
                            .softDelete()
                            .whereEntity(user)
                            .execute()
                        expect(user.deletedAt).to.be.instanceOf(Date)
                    }

                    const queryBuilder = repository.createQueryBuilder()
                    const result = await (
                        restore
                            ? queryBuilder.restore()
                            : queryBuilder.softDelete()
                    )
                        .whereEntity(user)
                        .returning('"id" INTO :id')
                        .setParameter("id", {
                            type: oracle.NUMBER,
                            dir: oracle.BIND_OUT,
                        })
                        .execute()

                    // raw keeps the driver's native output binds
                    expect(result.raw).to.deep.equal([[user.id]])

                    // the entity is refreshed from the database
                    expect(result.generatedMaps).to.have.length(1)
                    const reloaded = await repository.findOneOrFail({
                        where: { id: user.id },
                        withDeleted: true,
                    })
                    if (restore) expect(reloaded.deletedAt).to.equal(null)
                    else expect(reloaded.deletedAt).to.be.instanceOf(Date)
                    expect(user.deletedAt).to.deep.equal(reloaded.deletedAt)
                }),
            ))
    }
})
