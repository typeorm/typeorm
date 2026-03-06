import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Lesson } from "./entity/Lesson"
import { Course } from "./entity/Course"
import { StudyPlan } from "./entity/StudyPlan"
import { _StudyPlanCourse } from "./entity/_StudyPlanCourse"

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

    it("should include database schema in table name in joins", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection
                    .getRepository(Course)
                    .save({ id: "c1", name: "Math" })
                await connection
                    .getRepository(StudyPlan)
                    .save({ id: "p1", name: "Plan A" })
                await connection
                    .getRepository(_StudyPlanCourse)
                    .save({ studyPlanId: "p1", courseId: "c1" })
                await connection
                    .getRepository(Lesson)
                    .save({ id: 1, courseId: "c1", duration: 60 })

                const qb = connection
                    .getRepository(Lesson)
                    .createQueryBuilder("Lesson")
                    .select("SUM(Lesson.duration)", "duration")
                    .innerJoin(
                        "_StudyPlanCourse",
                        "courses",
                        "Lesson.courseId = courses.courseId",
                    )
                    .where("courses.studyPlanId = :planId", { planId: "p1" })

                const sql = qb.getSql()
                sql.should.to.contain(
                    `INNER JOIN ${connection.driver.escape("myschema")}.${connection.driver.escape("_StudyPlanCourse")} "courses" ON "Lesson"."courseId" = "courses"."courseId"`,
                )

                const result = await qb.getRawOne()
                Number(result.duration).should.be.equal(60)
            }),
        ))
    it("should include database schema in table name in subquery joins", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection
                    .getRepository(Course)
                    .save({ id: "c1", name: "Math" })
                await connection
                    .getRepository(StudyPlan)
                    .save({ id: "p1", name: "Plan A" })
                await connection
                    .getRepository(_StudyPlanCourse)
                    .save({ studyPlanId: "p1", courseId: "c1" })
                await connection
                    .getRepository(Lesson)
                    .save({ id: 1, courseId: "c1", duration: 60 })

                const qb = connection
                    .getRepository(StudyPlan)
                    .createQueryBuilder("plan")
                    .select("plan.name", "name")
                    .where((qb) => {
                        const subQuery = qb
                            .subQuery()
                            .select("course.studyPlanId")
                            .from(_StudyPlanCourse, "course")
                            .innerJoin(
                                Lesson,
                                "lesson",
                                "lesson.courseId = course.courseId",
                            )
                            .where("lesson.duration > :duration", {
                                duration: 30,
                            })
                            .getQuery()
                        return "plan.id IN " + subQuery
                    })

                const sql = qb.getSql()
                sql.should.to.contain(
                    `INNER JOIN ${connection.driver.escape("myschema")}.${connection.driver.escape("lesson")} "lesson" ON "lesson"."courseId" = "course"."courseId"`,
                )

                const result = await qb.getRawOne()
                result.name.should.be.equal("Plan A")
            }),
        ))
})
