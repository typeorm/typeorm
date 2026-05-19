import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { In } from "../../../../src/find-options/operator/In"
import { Not } from "../../../../src/find-options/operator/Not"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { User } from "./entity/User"

describe("FindOperator > clone()", () => {
    it("should return a new instance with the same configuration", () => {
        const op = Not("alice")
        const cloned = op.clone()

        expect(cloned).to.not.equal(op)
        expect(cloned.type).to.equal(op.type)
        expect(cloned.value).to.equal(op.value)
        expect(cloned.useParameter).to.equal(op.useParameter)
        expect(cloned.multipleParameters).to.equal(op.multipleParameters)
    })

    it("should isolate transformValue mutations to the cloned instance", () => {
        const op = Not("alice")
        const cloned = op.clone()

        cloned.transformValue({
            to: (v: string) => `${v}-suffix`,
            from: (v: string) => v,
        })

        expect(cloned.value).to.equal("alice-suffix")
        expect(op.value).to.equal("alice")
    })

    it("should recursively clone nested FindOperator values", () => {
        const inner = Not("alice")
        const outer = Not(inner)
        const cloned = outer.clone()

        cloned.transformValue({
            to: (v: string) => `${v}-suffix`,
            from: (v: string) => v,
        })

        expect(inner.value).to.equal("alice")
    })

    it("should copy array values so per-element mutations do not leak", () => {
        const op = In(["a", "b", "c"])
        const cloned = op.clone()

        expect(cloned.value).to.not.equal(op.value)
        expect(cloned.value).to.deep.equal(["a", "b", "c"])

        cloned.transformValue({
            to: (v: string) => `${v}-suffix`,
            from: (v: string) => v,
        })

        expect(op.value).to.deep.equal(["a", "b", "c"])
    })

    it("should recursively clone FindOperator values inside arrays", () => {
        const inner = Not("alice")
        const outer = In([inner])
        const cloned = outer.clone()

        expect((cloned.value as any[])[0]).to.not.equal(inner)

        cloned.transformValue({
            to: (v: string) => `${v}-suffix`,
            from: (v: string) => v,
        })

        expect(inner.value).to.equal("alice")
    })
})

describe("find options > FindOptionsWhere reuse with column transformer", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not mutate a reused FindOperator when a column transformer is applied", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const seed = new User()
                seed.name = "alice"
                await dataSource.manager.save(seed)

                const reusedNot = Not("alice")

                await dataSource.manager.find(User, {
                    where: { name: reusedNot },
                })
                expect(reusedNot.value).to.equal("alice")

                await dataSource.manager.find(User, {
                    where: { name: reusedNot },
                })
                expect(reusedNot.value).to.equal("alice")
            }),
        ))

    it("should not mutate a nested reused FindOperator", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const reusedInner = Not("alice")
                const reusedOuter = Not(reusedInner)

                await dataSource.manager.find(User, {
                    where: { name: reusedOuter },
                })
                expect(reusedInner.value).to.equal("alice")

                await dataSource.manager.find(User, {
                    where: { name: reusedOuter },
                })
                expect(reusedInner.value).to.equal("alice")
            }),
        ))

    it("should keep ordinary single-shot queries working unchanged", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const a = new User()
                a.name = "alice"
                const b = new User()
                b.name = "bob"
                await dataSource.manager.save([a, b])

                const matched = await dataSource.manager.find(User, {
                    where: { name: Not("alice") },
                    order: { id: "asc" },
                })

                expect(matched.map((row) => row.name)).to.deep.equal(["bob"])
            }),
        ))

    it("should not mutate a reused FindOperator when no column transformer is applied", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const a = new User()
                a.name = "alice"
                const b = new User()
                b.name = "bob"
                await dataSource.manager.save([a, b])

                const reusedNot = Not(a.id)

                const matched = await dataSource.manager.find(User, {
                    where: { id: reusedNot },
                    order: { id: "asc" },
                })

                expect(matched.map((row) => row.id)).to.deep.equal([b.id])
                expect(reusedNot.value).to.equal(a.id)

                await dataSource.manager.find(User, {
                    where: { id: reusedNot },
                })
                expect(reusedNot.value).to.equal(a.id)
            }),
        ))
})
