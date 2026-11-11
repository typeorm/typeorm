import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { ChildEntity } from "../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { TableInheritance } from "../../../../src/decorator/entity/TableInheritance"
import { UpdateDateColumn } from "../../../../src/decorator/columns/UpdateDateColumn"
import { VersionColumn } from "../../../../src/decorator/columns/VersionColumn"
import { InitCommand } from "../../../../src/commands/InitCommand"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

@Entity("pgu_document")
class Document {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string

    @Column({ type: "varchar", length: 50, nullable: true })
    title: string | null

    @VersionColumn()
    version: number

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date
}

@Entity("pgu_animal")
@TableInheritance({ column: { type: "varchar", length: 20, name: "kind" } })
class Animal {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string

    @Column({ type: "varchar", length: 50, nullable: true })
    name: string | null
}

@ChildEntity("dog")
class Dog extends Animal {
    @Column({ type: "varchar", length: 50, nullable: true })
    breed: string | null
}

describe("driver > spanner-postgres > upsert of managed columns", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["spanner-postgres"],
            entities: [Document, Animal, Dog],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const forEachDataSource = (fn: (dataSource: DataSource) => Promise<any>) =>
        Promise.all(dataSources.map(fn))

    it("should upsert an entity with a version column", () =>
        forEachDataSource(async (dataSource) => {
            const repository = dataSource.getRepository(Document)

            await repository.upsert({ id: "a", title: "first" }, ["id"])
            expect(
                (await repository.findOneByOrFail({ id: "a" })).version,
            ).to.equal(1)

            await repository.upsert({ id: "a", title: "second" }, ["id"])
            const document = await repository.findOneByOrFail({ id: "a" })
            expect(document.title).to.equal("second")
            // Spanner only accepts excluded.<column>: the version is the inserted one
            expect(document.version).to.equal(1)
        }))

    it("should upsert a child of a single table inheritance", () =>
        forEachDataSource(async (dataSource) => {
            const repository = dataSource.getRepository(Dog)

            await repository.upsert({ id: "d", name: "rex", breed: "a" }, [
                "id",
            ])
            await repository.upsert({ id: "d", name: "max", breed: "b" }, [
                "id",
            ])

            const dog = await repository.findOneByOrFail({ id: "d" })
            expect([dog.name, dog.breed]).to.deep.equal(["max", "b"])
            expect(await dataSource.getRepository(Animal).count()).to.equal(1)
        }))
})

describe("driver > spanner-postgres > init command", () => {
    it("should not parse the string id of the user in the express controller", () => {
        const controller = InitCommand["getControllerTemplate"](
            false,
            "spanner-postgres",
        )

        expect(controller).to.contain("const id = request.params.id")
        expect(controller).not.to.contain("parseInt")
    })

    it("should keep parsing the numeric id of the user for the other databases", () => {
        const controller = InitCommand["getControllerTemplate"](
            false,
            "postgres",
        )

        expect(controller).to.contain("const id = parseInt(request.params.id)")
    })
})
