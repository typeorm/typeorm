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
import { Badge } from "./entity/Badge"
import { BadgeInfo } from "./entity/BadgeInfo"
import { EmployeeProfile } from "./entity/EmployeeProfile"

/**
 * Tests that eager relations inside a NESTED embedded class (embedded-inside-
 * embedded) are properly scoped to the STI child that declares the outer
 * embedded, and not leaked to siblings.
 *
 *   Person (parent)
 *     ├── Employee (child, has @Column(() => EmployeeProfile))
 *     │     └── EmployeeProfile (embedded, has @Column(() => BadgeInfo))
 *     │           └── BadgeInfo (nested embedded, has eager Badge relation)
 *     └── Student (sibling child, no embedded)
 */
describe("table-inheritance > single-table > relations > eager-scoping-nested-embedded", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should load eager relation from nested embedded for the declaring child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const badge = new Badge()
                badge.serial = "NE-001"
                await connection.getRepository(Badge).save(badge)

                const employee = new Employee()
                employee.name = "Alice"
                employee.salary = 70000
                employee.profile = new EmployeeProfile()
                employee.profile.department = "Engineering"
                employee.profile.badgeInfo = new BadgeInfo()
                employee.profile.badgeInfo.issuer = "HQ"
                employee.profile.badgeInfo.badge = badge
                await connection.getRepository(Employee).save(employee)

                const loaded = await connection
                    .getRepository(Employee)
                    .findOne({ where: { name: "Alice" } })

                expect(loaded).to.not.be.null
                expect(loaded!.profile).to.not.be.undefined
                expect(loaded!.profile.department).to.equal("Engineering")
                expect(loaded!.profile.badgeInfo).to.not.be.undefined
                expect(loaded!.profile.badgeInfo.issuer).to.equal("HQ")
                expect(loaded!.profile.badgeInfo.badge).to.not.be.undefined
                expect(loaded!.profile.badgeInfo.badge).to.not.be.null
                expect(loaded!.profile.badgeInfo.badge.serial).to.equal(
                    "NE-001",
                )
            }),
        ))

    it("should NOT load nested embedded eager relation for sibling child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const badge = new Badge()
                badge.serial = "NE-002"
                await connection.getRepository(Badge).save(badge)

                const employee = new Employee()
                employee.name = "Bob"
                employee.salary = 60000
                employee.profile = new EmployeeProfile()
                employee.profile.department = "Sales"
                employee.profile.badgeInfo = new BadgeInfo()
                employee.profile.badgeInfo.issuer = "Branch"
                employee.profile.badgeInfo.badge = badge
                await connection.getRepository(Employee).save(employee)

                const student = new Student()
                student.name = "Carol"
                student.grade = 11
                await connection.getRepository(Student).save(student)

                // Student should NOT have profile.badgeInfo.badge from Employee
                const loaded = await connection
                    .getRepository(Student)
                    .findOne({ where: { name: "Carol" } })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Carol")
                // The nested embedded relation should not be joined for Student
                expect("profile" in loaded!).to.equal(false)
            }),
        ))
})
