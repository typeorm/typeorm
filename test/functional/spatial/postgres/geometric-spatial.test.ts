import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { GeometryEntity } from "./entity/GeometryEntity"

// Tests for standard geometric types
describe("standard geometric types", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [GeometryEntity],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(async () => {
        try {
            await reloadTestingDatabases(connections)
        } catch (err) {
            console.warn(err.stack)
            throw err
        }
    })
    after(async () => {
        try {
            await closeTestingConnections(connections)
        } catch (err) {
            console.warn(err.stack)
            throw err
        }
    })

    describe("Point type", () => {
        it("should handle point with string input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        point: "(10.5,20.3)",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.point).to.deep.equal({ x: 10.5, y: 20.3 })

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))

        it("should handle point with object input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        point: { x: -5, y: 15 },
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.point).to.deep.equal({ x: -5, y: 15 })

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Circle type", () => {
        it("should handle circle with string input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        circle: "<(4,5),12>",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.circle).to.deep.equal({
                        x: 4,
                        y: 5,
                        radius: 12,
                    })
                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))

        it("should handle circle with object input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        circle: { x: 10, y: 20, radius: 5 },
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.circle).to.deep.equal({
                        x: 10,
                        y: 20,
                        radius: 5,
                    })

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Box type", () => {
        it("should handle box round-trip with string input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        box: "(1,2),(3,4)",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.box).to.be.a("string")
                    expect(loaded.box).to.equal("(3,4),(1,2)") // Postgres reorders box corners as upper-right, lower-left

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Line type", () => {
        it("should handle line with string input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        line: "{1,2,3}",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.line).to.equal("{1,2,3}")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))

        it("should handle line alternative input format", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        line: "[(1,2),(3,4)]",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.line).to.be.a("string")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Line Segment (lseg) type", () => {
        it("should handle lseg with string input", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        lseg: "[(1,2),(3,4)]",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.lseg).to.equal("[(1,2),(3,4)]")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))

        it("should handle lseg alternative format", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        lseg: "(1,2), (3,4)",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.lseg).to.equal("[(1,2),(3,4)]")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Path type", () => {
        it("should handle open path", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        path: "[(1,2),(3,4),(5,6)]",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.path).to.equal("[(1,2),(3,4),(5,6)]")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))

        it("should handle closed path", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        path: "((3,1),(2,8),(10,4))",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.path).to.equal("((3,1),(2,8),(10,4))")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Polygon type", () => {
        it("should handle polygon", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        polygon: "((3,1),(2,8),(10,4))",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.polygon).to.equal("((3,1),(2,8),(10,4))")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))

        it("should handle polygon alternative format", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        polygon: "(0,0), (1,1), (2,0)",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })
                    expect(loaded.polygon).to.be.a("string")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })

    describe("Mixed geometry types", () => {
        it("should handle all geometry types in a single entity", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(GeometryEntity)

                    const entity = await repo.save({
                        point: "(1,2)",
                        circle: "<(4,5),12>",
                        box: "(1,2),(3,4)",
                        line: "{1,2,3}",
                        lseg: "[(1,2),(3,4)]",
                        path: "[(1,2),(3,4),(5,6)]",
                        polygon: "((3,1),(2,8),(10,4))",
                    } as GeometryEntity)

                    const loaded = await repo.findOneOrFail({
                        where: { id: entity.id },
                    })

                    expect(loaded.point).to.deep.equal({ x: 1, y: 2 })
                    expect(loaded.circle).to.deep.equal({
                        x: 4,
                        y: 5,
                        radius: 12,
                    })
                    expect(loaded.box).to.equal("(3,4),(1,2)") // String, reordered by Postgres as upper-right, lower-left
                    expect(loaded.line).to.equal("{1,2,3}")
                    expect(loaded.lseg).to.equal("[(1,2),(3,4)]")
                    expect(loaded.path).to.equal("[(1,2),(3,4),(5,6)]")
                    expect(loaded.polygon).to.equal("((3,1),(2,8),(10,4))")

                    await expect(repo.save(loaded)).to.be.fulfilled
                }),
            ))
    })
})
