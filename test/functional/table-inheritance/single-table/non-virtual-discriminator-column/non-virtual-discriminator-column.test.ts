import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Student } from "./entity/Student"
import { Employee } from "./entity/Employee"
import { Other } from "./entity/Other"
import { Person } from "./entity/Person"

describe("table-inheritance > single-table > non-virtual-discriminator-column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return non virtual discriminator column as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // -------------------------------------------------------------------------
                // Create
                // -------------------------------------------------------------------------

                const student = new Student()
                student.name = "Alice"
                student.faculty = "Economics"
                await dataSource.getRepository(Student).save(student)

                const employee = new Employee()
                employee.name = "Roger"
                employee.salary = 1000
                await dataSource.getRepository(Employee).save(employee)

                if (!(dataSource.driver.options.type === "oracle")) {
                    // In Oracle, empty string is a `null` so this isn't exactly possible there.

                    const other = new Other()
                    other.name = "Empty"
                    other.mood = "Happy"
                    await dataSource.getRepository(Other).save(other)
                }

                // -------------------------------------------------------------------------
                // Select
                // -------------------------------------------------------------------------

                const persons = await dataSource.manager
                    .createQueryBuilder(Person, "person")
                    .addOrderBy("person.id")
                    .getMany()

                persons[0].id.should.be.equal(1)
                persons[0].type.should.be.equal("student-type")
                persons[0].name.should.be.equal("Alice")
                ;(persons[0] as Student).faculty.should.be.equal("Economics")

                persons[1].id.should.be.equal(2)
                persons[1].type.should.be.equal("employee-type")
                persons[1].name.should.be.equal("Roger")
                ;(persons[1] as Employee).salary.should.be.equal(1000)

                if (!(dataSource.driver.options.type === "oracle")) {
                    // In Oracle, empty string is a `null` so this isn't exactly possible there.

                    persons[2].id.should.be.equal(3)
                    persons[2].type.should.be.equal("")
                    persons[2].name.should.be.equal("Empty")
                    ;(persons[2] as Other).mood.should.be.equal("Happy")
                }
            }),
        ))
})
