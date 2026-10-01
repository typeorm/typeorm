import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Lesson } from "./entity/Lesson"
import { Course } from "./entity/Course"
import { StudyPlan } from "./entity/StudyPlan"
import { StudyPlanCourse } from "./entity/StudyPlanCourse"

describe("multi-schema-and-database > custom-schema-joins", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.ts,.js}"],
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "sap"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource) {
        await dataSource.getRepository(Course).save({ id: "c1", name: "Math" })
        await dataSource
            .getRepository(StudyPlan)
            .save({ id: "p1", name: "Plan A" })
        await dataSource
            .getRepository(StudyPlanCourse)
            .save({ studyPlanId: "p1", courseId: "c1" })
        await dataSource
            .getRepository(Lesson)
            .save({ courseId: "c1", duration: 60 })
    }

    describe("should schema qualify in joins", () => {
        it("innerJoin", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    const qb = dataSource
                        .getRepository(Lesson)
                        .createQueryBuilder("Lesson")
                        .select("SUM(Lesson.duration)", "duration")
                        .innerJoin(
                            "StudyPlanCourse",
                            "courses",
                            "Lesson.courseId = courses.courseId",
                        )
                        .where("courses.studyPlanId = :planId", {
                            planId: "p1",
                        })

                    const sql = qb.getSql()
                    sql.should.to.contain(
                        `INNER JOIN ${dataSource.driver.escape("myschema")}.${dataSource.driver.escape("StudyPlanCourse")} "courses" ON "Lesson"."courseId" = "courses"."courseId"`,
                    )

                    const result = await qb.getRawOne()
                    Number(result.duration).should.be.equal(60)
                }),
            ))
        it("leftJoin", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    const qb = dataSource
                        .getRepository(Lesson)
                        .createQueryBuilder("Lesson")
                        .select("SUM(Lesson.duration)", "duration")
                        .leftJoin(
                            "StudyPlanCourse",
                            "courses",
                            "Lesson.courseId = courses.courseId",
                        )
                        .where("courses.studyPlanId = :planId", {
                            planId: "p1",
                        })

                    const sql = qb.getSql()
                    sql.should.to.contain(
                        `LEFT JOIN ${dataSource.driver.escape("myschema")}.${dataSource.driver.escape("StudyPlanCourse")} "courses" ON "Lesson"."courseId" = "courses"."courseId"`,
                    )

                    const result = await qb.getRawOne()
                    Number(result.duration).should.be.equal(60)
                }),
            ))

        it("leftJoinAndSelect", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    const qb = dataSource
                        .getRepository(Lesson)
                        .createQueryBuilder("Lesson")
                        .select("SUM(Lesson.duration)", "duration")
                        .leftJoinAndSelect(
                            "StudyPlanCourse",
                            "courses",
                            "Lesson.courseId = courses.courseId",
                        )
                        .where("courses.studyPlanId = :planId", {
                            planId: "p1",
                        })
                        .groupBy("courses.studyPlanId")
                        .addGroupBy("courses.courseId")

                    const sql = qb.getSql()
                    sql.should.to.contain(
                        `LEFT JOIN ${dataSource.driver.escape("myschema")}.${dataSource.driver.escape("StudyPlanCourse")} "courses" ON "Lesson"."courseId" = "courses"."courseId"`,
                    )

                    const result = await qb.getRawOne()
                    Number(result.duration).should.be.equal(60)
                }),
            ))
        it("innerJoinAndSelect", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    const qb = dataSource
                        .getRepository(Lesson)
                        .createQueryBuilder("Lesson")
                        .select("SUM(Lesson.duration)", "duration")
                        .innerJoinAndSelect(
                            "StudyPlanCourse",
                            "courses",
                            "Lesson.courseId = courses.courseId",
                        )
                        .where("courses.studyPlanId = :planId", {
                            planId: "p1",
                        })
                        .groupBy("courses.studyPlanId")
                        .addGroupBy("courses.courseId")

                    const sql = qb.getSql()
                    sql.should.to.contain(
                        `INNER JOIN ${dataSource.driver.escape("myschema")}.${dataSource.driver.escape("StudyPlanCourse")} "courses" ON "Lesson"."courseId" = "courses"."courseId"`,
                    )

                    const result = await qb.getRawOne()
                    Number(result.duration).should.be.equal(60)
                }),
            ))
    })
})
