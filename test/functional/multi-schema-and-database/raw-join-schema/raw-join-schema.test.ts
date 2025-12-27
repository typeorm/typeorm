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
import { expect } from "chai"

// Verify that raw table names in joins are properly schema-qualified
// and that aliases are properly escaped in conditions.
// Supports Postgres, CockroachDB, MSSQL.

describe("multi-schema-and-database > raw-join-schema", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Lesson, Course, StudyPlan, _StudyPlanCourse],
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "sap"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should schema-qualify raw table name in join and escape alias in conditions", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Insert test data
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
                console.log(sql)
                expect(sql).to.contain('"myschema"."_StudyPlanCourse"')

                const result = await qb.getRawOne()
                expect(result.duration).to.equal("60")
            }),
        ))
})
