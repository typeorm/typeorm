import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Annotation, Badge, Holder, Seen } from "./entity/Annotation"

// https://github.com/typeorm/typeorm/issues/10465
describe("persistence > orphanage > delete before insert", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Annotation, Badge, Holder, Seen],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const seen = (userId: number) => Object.assign(new Seen(), { userId })

    const loadAnnotation = (dataSource: DataSource, id: number) =>
        dataSource.getRepository(Annotation).findOneOrFail({
            where: { id },
            relations: { seen: true },
        })

    it("should delete orphaned rows before inserting rows that replace them", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Annotation)

                const annotation = new Annotation()
                annotation.seen = [seen(1)]
                await repository.save(annotation)

                const loaded = await loadAnnotation(dataSource, annotation.id)
                loaded.seen = [seen(1)]
                await repository.save(loaded)

                const rows = await dataSource.getRepository(Seen).find()
                expect(rows).to.have.length(1)
                expect(rows[0].id).to.not.equal(annotation.seen[0].id)
            }),
        ))

    it("should apply foreign key reassignments before deleting the orphan they reference", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Annotation)

                const annotation = new Annotation()
                annotation.seen = [seen(1), seen(2)]
                await repository.save(annotation)

                const holder = await dataSource.getRepository(Holder).save(
                    Object.assign(new Holder(), {
                        seen: { id: annotation.seen[0].id },
                    }),
                )

                const loaded = await loadAnnotation(dataSource, annotation.id)
                const kept = loaded.seen.find((s) => s.userId === 2)!
                // user 1 is replaced and the holder moves away from it
                loaded.seen = [kept, seen(1)]
                holder.seen = kept

                await dataSource.manager.save([loaded, holder])

                const rows = await dataSource.getRepository(Seen).find()
                expect(rows).to.have.length(2)
                const reloadedHolder = await dataSource
                    .getRepository(Holder)
                    .findOneOrFail({
                        where: { id: holder.id },
                        relations: { seen: true },
                    })
                expect(reloadedHolder.seen!.id).to.equal(kept.id)
            }),
        ))

    it("should not run updates early when they reference a row pending insertion", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Annotation)

                const annotation = new Annotation()
                annotation.seen = [seen(1)]
                await repository.save(annotation)

                const holder = await dataSource
                    .getRepository(Holder)
                    .save(new Holder())

                const loaded = await loadAnnotation(dataSource, annotation.id)
                loaded.seen = [seen(1)]
                // a different object that carries the id of the badge being inserted
                holder.badge = Object.assign(new Badge(), { id: 5 })

                await dataSource.manager.save([
                    loaded,
                    holder,
                    Object.assign(new Badge(), { id: 5 }),
                ])

                const reloadedHolder = await dataSource
                    .getRepository(Holder)
                    .findOneOrFail({
                        where: { id: holder.id },
                        relations: { badge: true },
                    })
                expect(reloadedHolder.badge!.id).to.equal(5)
                expect(await dataSource.getRepository(Seen).count()).to.equal(1)
            }),
        ))
})
