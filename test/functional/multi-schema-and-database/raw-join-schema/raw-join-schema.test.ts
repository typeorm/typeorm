import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Lesson } from "./entity/Lesson"
import { expect } from "chai"

describe("multi-schema-and-database > raw-join-schema", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Lesson],
            enabledDrivers: ["postgres", "mssql"],
            schema: "myschema",
            schemaCreate: false,
            dropSchema: false,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should schema-qualify raw table name in join and escape alias in conditions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qb = connection
                    .getRepository(Lesson)
                    .createQueryBuilder()
                    .select("SUM(Lesson.duration)", "duration")
                    .innerJoin(
                        "_StudyPlanCourse",
                        "courses",
                        "Lesson.courseId = courses.courseId",
                    )
                    .where("courses.planId = :planId", { planId: "p1" })

                const sql = qb.getSql()

                if (connection.driver.options.type === "postgres") {
                    expect(sql).to.contain(
                        'INNER JOIN "myschema"."_StudyPlanCourse" "courses"',
                    )
                    expect(sql).to.match(
                        /WHERE (?:"courses"\."planId"|courses\.planId) = \$(?:\d+)/,
                    )
                }
                if (connection.driver.options.type === "mssql") {
                    expect(sql).to.contain(
                        'INNER JOIN "myschema"."_StudyPlanCourse" "courses"',
                    )
                    // mssql param is @0, @1, ... and alias escaping is with quotes by TypeORM
                    expect(sql).to.match(
                        /WHERE (?:"courses"\."planId"|courses\.planId) = @\d+/,
                    )
                }
            }),
        ))

    it("should also qualify quoted raw table names in join", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qb = connection
                    .getRepository(Lesson)
                    .createQueryBuilder()
                    .select("SUM(Lesson.duration)", "duration")
                    .innerJoin(
                        '"_StudyPlanCourse"',
                        "courses",
                        "Lesson.courseId = courses.courseId",
                    )
                    .where("courses.planId = :planId", { planId: "p1" })

                const sql = qb.getSql()

                if (connection.driver.options.type === "postgres") {
                    expect(sql).to.contain(
                        'INNER JOIN "myschema"."_StudyPlanCourse" "courses"',
                    )
                    expect(sql).to.match(
                        /WHERE (?:"courses"\."planId"|courses\.planId) = \$(?:\d+)/,
                    )
                }
                if (connection.driver.options.type === "mssql") {
                    expect(sql).to.contain(
                        'INNER JOIN "myschema"."_StudyPlanCourse" "courses"',
                    )
                    expect(sql).to.match(
                        /WHERE (?:"courses"\."planId"|courses\.planId) = @\d+/,
                    )
                }
            }),
        ))
})
