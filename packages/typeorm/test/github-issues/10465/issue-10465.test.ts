import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Annotation, Seen } from "./entity/Annotation"

describe("github issues > #10465 orphanedRowAction delete runs before insert", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Annotation, Seen],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should delete orphaned rows before inserting rows that replace them", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Annotation)

                const annotation = new Annotation()
                annotation.seen = [Object.assign(new Seen(), { userId: 1 })]
                await repository.save(annotation)

                const loaded = await repository.findOneOrFail({
                    where: { id: annotation.id },
                    relations: { seen: true },
                })
                loaded.seen = [Object.assign(new Seen(), { userId: 1 })]
                await repository.save(loaded)

                const rows = await dataSource.getRepository(Seen).find()
                expect(rows).to.have.length(1)
                expect(rows[0].id).to.not.equal(annotation.seen[0].id)
            }),
        ))
})
