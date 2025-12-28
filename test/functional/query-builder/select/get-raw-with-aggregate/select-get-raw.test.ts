import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Course } from "./entity/Lesson"

describe("should return aggregate values using getRaw methods", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Course],
                enabledDrivers: [
                    "mysql",
                    "postgres",
                    "cockroachdb",
                    "sqlite",
                    "sqljs",
                    "mssql",
                    "better-sqlite3",
                ],
            })),
    )
    beforeEach(async () => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("sum", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Course).save([
                    { courseName: "c1", duration: 5 },
                    { courseName: "c2", duration: 10 },
                    { courseName: "c2", duration: 15 },
                    { courseName: "c3", duration: 20 },
                ])

                const resultOne = await connection
                    .createQueryBuilder()
                    .select("SUM(course.duration)", "sum")
                    .from(Course, "course")
                    .getRawOne()

                expect(resultOne).to.be.not.null
                expect(resultOne.sum).to.equal(50)

                const resultMany = await connection
                    .createQueryBuilder()
                    .select("course.courseName", "courseName")
                    .addSelect("SUM(course.duration)", "sum")
                    .from(Course, "course")
                    .groupBy("course.courseName")
                    .getRawMany()

                expect(resultMany).to.be.not.null
                expect(resultMany.length).to.equal(3)
                expect(resultMany).to.deep.include({
                    courseName: "c1",
                    sum: 5,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c2",
                    sum: 25,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c3",
                    sum: 20,
                })
            }),
        ))

    it("avg", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Course).save([
                    { courseName: "c1", duration: 10 },
                    { courseName: "c2", duration: 10 },
                    { courseName: "c2", duration: 20 },
                ])

                const resultOne = await connection
                    .createQueryBuilder()
                    .select("AVG(course.duration)", "avg")
                    .from(Course, "course")
                    .getRawOne()

                expect(resultOne).to.be.not.null
                expect(resultOne.avg).to.closeTo(13.333, 0.5) // depends on database precision

                const resultMany = await connection
                    .createQueryBuilder()
                    .select("course.courseName", "courseName")
                    .addSelect("AVG(course.duration)", "avg")
                    .from(Course, "course")
                    .groupBy("course.courseName")
                    .getRawMany()

                expect(resultMany).to.be.not.null
                expect(resultMany.length).to.equal(2)
                expect(resultMany).to.deep.include({
                    courseName: "c1",
                    avg: 10,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c2",
                    avg: 15,
                })
            }),
        ))

    it("min", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Course).save([
                    { courseName: "c1", duration: 5 },
                    { courseName: "c2", duration: 10 },
                    { courseName: "c2", duration: 15 },
                    { courseName: "c3", duration: 20 },
                ])

                const resultOne = await connection
                    .createQueryBuilder()
                    .select("MIN(course.duration)", "min")
                    .from(Course, "course")
                    .getRawOne()

                expect(resultOne).to.be.not.null
                expect(resultOne.min).to.equal(5)

                const resultMany = await connection
                    .createQueryBuilder()
                    .select("course.courseName", "courseName")
                    .addSelect("MIN(course.duration)", "min")
                    .from(Course, "course")
                    .groupBy("course.courseName")
                    .getRawMany()

                expect(resultMany).to.be.not.null
                expect(resultMany.length).to.equal(3)
                expect(resultMany).to.deep.include({
                    courseName: "c1",
                    min: 5,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c2",
                    min: 10,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c3",
                    min: 20,
                })
            }),
        ))

    it("max", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Course).save([
                    { courseName: "c1", duration: 5 },
                    { courseName: "c2", duration: 10 },
                    { courseName: "c2", duration: 15 },
                    { courseName: "c3", duration: 20 },
                ])

                const resultOne = await connection
                    .createQueryBuilder()
                    .select("MAX(course.duration)", "max")
                    .from(Course, "course")
                    .getRawOne()

                expect(resultOne).to.be.not.null
                expect(resultOne.max).to.equal(20)

                const resultMany = await connection
                    .createQueryBuilder()
                    .select("course.courseName", "courseName")
                    .addSelect("MAX(course.duration)", "max")
                    .from(Course, "course")
                    .groupBy("course.courseName")
                    .getRawMany()

                expect(resultMany).to.be.not.null
                expect(resultMany.length).to.equal(3)
                expect(resultMany).to.deep.include({
                    courseName: "c1",
                    max: 5,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c2",
                    max: 15,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c3",
                    max: 20,
                })
            }),
        ))

    it("count", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Course).save([
                    { courseName: "c1", duration: 5 },
                    { courseName: "c2", duration: 10 },
                    { courseName: "c2", duration: 15 },
                    { courseName: "c3", duration: 20 },
                ])

                const resultOne = await connection
                    .createQueryBuilder()
                    .select("COUNT(course.id)", "count")
                    .from(Course, "course")
                    .getRawOne()

                expect(resultOne).to.be.not.null
                expect(resultOne.count).to.equal(4)

                const resultMany = await connection
                    .createQueryBuilder()
                    .select("course.courseName", "courseName")
                    .addSelect("COUNT(course.id)", "count")
                    .from(Course, "course")
                    .groupBy("course.courseName")
                    .getRawMany()

                expect(resultMany).to.be.not.null
                expect(resultMany.length).to.equal(3)
                expect(resultMany).to.deep.include({
                    courseName: "c1",
                    count: 1,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c2",
                    count: 2,
                })
                expect(resultMany).to.deep.include({
                    courseName: "c3",
                    count: 1,
                })
            }),
        ))
})
