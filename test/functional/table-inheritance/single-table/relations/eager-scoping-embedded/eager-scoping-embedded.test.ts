import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { DataSource } from "../../../../../../src/data-source/DataSource"
import { Employee } from "./entity/Employee"
import { Student } from "./entity/Student"
import { EmployeeBadge } from "./entity/EmployeeBadge"
import { EmployeeProfile } from "./entity/EmployeeProfile"

/**
 * Tests that eager relations inside an embedded class are properly scoped
 * to the STI child that declares the embedded, and not leaked to siblings.
 *
 *   Person (parent)
 *     ├── Employee (child, has @Column(() => EmployeeProfile) with eager badge)
 *     └── Student (sibling child, no embedded)
 */
describe("table-inheritance > single-table > relations > eager-scoping-embedded", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should load eager relation from embedded for the declaring child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const badge = new EmployeeBadge()
                badge.badgeNumber = "EMB-001"
                await connection.getRepository(EmployeeBadge).save(badge)

                const employee = new Employee()
                employee.name = "Alice"
                employee.salary = 70000
                employee.profile = new EmployeeProfile()
                employee.profile.department = "Engineering"
                employee.profile.badge = badge
                await connection.getRepository(Employee).save(employee)

                const loaded = await connection
                    .getRepository(Employee)
                    .findOne({ where: { name: "Alice" } })

                expect(loaded).to.not.be.null
                expect(loaded!.profile).to.not.be.undefined
                expect(loaded!.profile.department).to.equal("Engineering")
                expect(loaded!.profile.badge).to.not.be.undefined
                expect(loaded!.profile.badge).to.not.be.null
                expect(loaded!.profile.badge.badgeNumber).to.equal("EMB-001")
            }),
        ))

    it("should NOT load embedded eager relation for sibling child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const badge = new EmployeeBadge()
                badge.badgeNumber = "EMB-002"
                await connection.getRepository(EmployeeBadge).save(badge)

                const employee = new Employee()
                employee.name = "Bob"
                employee.salary = 60000
                employee.profile = new EmployeeProfile()
                employee.profile.department = "Sales"
                employee.profile.badge = badge
                await connection.getRepository(Employee).save(employee)

                const student = new Student()
                student.name = "Carol"
                student.grade = 11
                await connection.getRepository(Student).save(student)

                // Student should NOT have profile.badge from Employee
                const loaded = await connection
                    .getRepository(Student)
                    .findOne({ where: { name: "Carol" } })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Carol")
                // The embedded profile relation should not be joined for Student
                expect("profile" in loaded!).to.equal(false)
            }),
        ))
})
