"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../../utils/test-utils");
var Student_1 = require("./entity/Student");
var Teacher_1 = require("./entity/Teacher");
var Accountant_1 = require("./entity/Accountant");
var Employee_1 = require("./entity/Employee");
var Person_1 = require("./entity/Person");
var Faculty_1 = require("./entity/Faculty");
var Specialization_1 = require("./entity/Specialization");
var Department_1 = require("./entity/Department");
describe("table-inheritance > single-table > relations > many-to-many", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    describe("owner side", function () {
        it("should work correctly with ManyToMany relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var faculty1, faculty2, student, specialization1, specialization2, teacher, department1, department2, accountant, loadedStudent, loadedTeacher, loadedAccountant, loadedEmployees, loadedPersons;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        faculty1 = new Faculty_1.Faculty();
                        faculty1.name = "Economics";
                        return [4 /*yield*/, connection.getRepository(Faculty_1.Faculty).save(faculty1)];
                    case 1:
                        _a.sent();
                        faculty2 = new Faculty_1.Faculty();
                        faculty2.name = "Programming";
                        return [4 /*yield*/, connection.getRepository(Faculty_1.Faculty).save(faculty2)];
                    case 2:
                        _a.sent();
                        student = new Student_1.Student();
                        student.name = "Alice";
                        student.faculties = [faculty1, faculty2];
                        return [4 /*yield*/, connection.getRepository(Student_1.Student).save(student)];
                    case 3:
                        _a.sent();
                        specialization1 = new Specialization_1.Specialization();
                        specialization1.name = "Geography";
                        return [4 /*yield*/, connection.getRepository(Specialization_1.Specialization).save(specialization1)];
                    case 4:
                        _a.sent();
                        specialization2 = new Specialization_1.Specialization();
                        specialization2.name = "Economist";
                        return [4 /*yield*/, connection.getRepository(Specialization_1.Specialization).save(specialization2)];
                    case 5:
                        _a.sent();
                        teacher = new Teacher_1.Teacher();
                        teacher.name = "Mr. Garrison";
                        teacher.specializations = [specialization1, specialization2];
                        teacher.salary = 2000;
                        return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).save(teacher)];
                    case 6:
                        _a.sent();
                        department1 = new Department_1.Department();
                        department1.name = "Bookkeeping";
                        return [4 /*yield*/, connection.getRepository(Department_1.Department).save(department1)];
                    case 7:
                        _a.sent();
                        department2 = new Department_1.Department();
                        department2.name = "HR";
                        return [4 /*yield*/, connection.getRepository(Department_1.Department).save(department2)];
                    case 8:
                        _a.sent();
                        accountant = new Accountant_1.Accountant();
                        accountant.name = "Mr. Burns";
                        accountant.departments = [department1, department2];
                        accountant.salary = 3000;
                        return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).save(accountant)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Student_1.Student, "student")
                                .leftJoinAndSelect("student.faculties", "faculty")
                                .where("student.name = :name", { name: "Alice" })
                                .getOne()];
                    case 10:
                        loadedStudent = _a.sent();
                        loadedStudent.should.have.all.keys("id", "name", "faculties");
                        loadedStudent.id.should.equal(1);
                        loadedStudent.name.should.equal("Alice");
                        loadedStudent.faculties.length.should.equal(2);
                        loadedStudent.faculties.map(function (f) { return f.name; }).should.deep.include("Economics");
                        loadedStudent.faculties.map(function (f) { return f.name; }).should.deep.include("Programming");
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Teacher_1.Teacher, "teacher")
                                .leftJoinAndSelect("teacher.specializations", "specialization")
                                .where("teacher.name = :name", { name: "Mr. Garrison" })
                                .getOne()];
                    case 11:
                        loadedTeacher = _a.sent();
                        loadedTeacher.should.have.all.keys("id", "name", "specializations", "salary");
                        loadedTeacher.id.should.equal(2);
                        loadedTeacher.name.should.equal("Mr. Garrison");
                        loadedTeacher.specializations.length.should.equal(2);
                        loadedTeacher.specializations.map(function (f) { return f.name; }).should.deep.include("Geography");
                        loadedTeacher.specializations.map(function (f) { return f.name; }).should.deep.include("Economist");
                        loadedTeacher.salary.should.equal(2000);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Accountant_1.Accountant, "accountant")
                                .leftJoinAndSelect("accountant.departments", "department")
                                .where("accountant.name = :name", { name: "Mr. Burns" })
                                .getOne()];
                    case 12:
                        loadedAccountant = _a.sent();
                        loadedAccountant.should.have.all.keys("id", "name", "departments", "salary");
                        loadedAccountant.id.should.equal(3);
                        loadedAccountant.name.should.equal("Mr. Burns");
                        loadedAccountant.departments.length.should.equal(2);
                        loadedAccountant.departments.map(function (f) { return f.name; }).should.deep.include("Bookkeeping");
                        loadedAccountant.departments.map(function (f) { return f.name; }).should.deep.include("HR");
                        loadedAccountant.salary.should.equal(3000);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Employee_1.Employee, "employee")
                                .leftJoinAndSelect("employee.specializations", "specialization")
                                .leftJoinAndSelect("employee.departments", "department")
                                .orderBy("employee.id, specialization.id, department.id")
                                .getMany()];
                    case 13:
                        loadedEmployees = _a.sent();
                        loadedEmployees[0].should.have.all.keys("id", "name", "salary", "specializations");
                        loadedEmployees[0].should.be.instanceof(Teacher_1.Teacher);
                        loadedEmployees[0].id.should.equal(2);
                        loadedEmployees[0].name.should.equal("Mr. Garrison");
                        loadedEmployees[0].specializations.length.should.equal(2);
                        loadedEmployees[0].specializations.map(function (f) { return f.name; }).should.deep.include("Geography");
                        loadedEmployees[0].specializations.map(function (f) { return f.name; }).should.deep.include("Economist");
                        loadedEmployees[0].salary.should.equal(2000);
                        loadedEmployees[1].should.have.all.keys("id", "name", "salary", "departments");
                        loadedEmployees[1].should.be.instanceof(Accountant_1.Accountant);
                        loadedEmployees[1].id.should.equal(3);
                        loadedEmployees[1].name.should.equal("Mr. Burns");
                        loadedEmployees[1].departments.length.should.equal(2);
                        loadedEmployees[1].departments.map(function (f) { return f.name; }).should.deep.include("Bookkeeping");
                        loadedEmployees[1].departments.map(function (f) { return f.name; }).should.deep.include("HR");
                        loadedEmployees[1].salary.should.equal(3000);
                        return [4 /*yield*/, connection.manager
                                .createQueryBuilder(Person_1.Person, "person")
                                .leftJoinAndSelect("person.faculties", "faculty")
                                .leftJoinAndSelect("person.specializations", "specialization")
                                .leftJoinAndSelect("person.departments", "department")
                                .orderBy("person.id, specialization.id, department.id")
                                .getMany()];
                    case 14:
                        loadedPersons = _a.sent();
                        loadedPersons[0].should.have.all.keys("id", "name", "faculties");
                        loadedPersons[0].should.be.instanceof(Student_1.Student);
                        loadedPersons[0].id.should.equal(1);
                        loadedPersons[0].name.should.equal("Alice");
                        loadedPersons[0].faculties.length.should.equal(2);
                        loadedPersons[0].faculties.map(function (f) { return f.name; }).should.deep.include("Economics");
                        loadedPersons[0].faculties.map(function (f) { return f.name; }).should.deep.include("Programming");
                        loadedPersons[1].should.have.all.keys("id", "name", "salary", "specializations");
                        loadedPersons[1].should.be.instanceof(Teacher_1.Teacher);
                        loadedPersons[1].id.should.equal(2);
                        loadedPersons[1].name.should.equal("Mr. Garrison");
                        loadedPersons[1].specializations.length.should.equal(2);
                        loadedPersons[1].specializations.map(function (f) { return f.name; }).should.deep.include("Geography");
                        loadedPersons[1].specializations.map(function (f) { return f.name; }).should.deep.include("Economist");
                        loadedPersons[1].salary.should.equal(2000);
                        loadedPersons[2].should.have.all.keys("id", "name", "salary", "departments");
                        loadedPersons[2].should.be.instanceof(Accountant_1.Accountant);
                        loadedPersons[2].id.should.equal(3);
                        loadedPersons[2].name.should.equal("Mr. Burns");
                        loadedPersons[2].departments.length.should.equal(2);
                        loadedPersons[2].departments.map(function (f) { return f.name; }).should.deep.include("Bookkeeping");
                        loadedPersons[2].departments.map(function (f) { return f.name; }).should.deep.include("HR");
                        loadedPersons[2].salary.should.equal(3000);
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
    describe("inverse side", function () {
        it("should work correctly with ManyToMany relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var student1, student2, faculty, teacher1, teacher2, specialization, accountant1, accountant2, department;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        student1 = new Student_1.Student();
                        student1.name = "Alice";
                        return [4 /*yield*/, connection.getRepository(Student_1.Student).save(student1)];
                    case 1:
                        _a.sent();
                        student2 = new Student_1.Student();
                        student2.name = "Bob";
                        return [4 /*yield*/, connection.getRepository(Student_1.Student).save(student2)];
                    case 2:
                        _a.sent();
                        faculty = new Faculty_1.Faculty();
                        faculty.name = "Economics";
                        faculty.students = [student1, student2];
                        return [4 /*yield*/, connection.getRepository(Faculty_1.Faculty).save(faculty)];
                    case 3:
                        _a.sent();
                        teacher1 = new Teacher_1.Teacher();
                        teacher1.name = "Mr. Garrison";
                        teacher1.salary = 2000;
                        return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).save(teacher1)];
                    case 4:
                        _a.sent();
                        teacher2 = new Teacher_1.Teacher();
                        teacher2.name = "Mr. Adler";
                        teacher2.salary = 1000;
                        return [4 /*yield*/, connection.getRepository(Teacher_1.Teacher).save(teacher2)];
                    case 5:
                        _a.sent();
                        specialization = new Specialization_1.Specialization();
                        specialization.name = "Geography";
                        specialization.teachers = [teacher1, teacher2];
                        return [4 /*yield*/, connection.getRepository(Specialization_1.Specialization).save(specialization)];
                    case 6:
                        _a.sent();
                        accountant1 = new Accountant_1.Accountant();
                        accountant1.name = "Mr. Burns";
                        accountant1.salary = 3000;
                        return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).save(accountant1)];
                    case 7:
                        _a.sent();
                        accountant2 = new Accountant_1.Accountant();
                        accountant2.name = "Mr. Trump";
                        accountant2.salary = 4000;
                        return [4 /*yield*/, connection.getRepository(Accountant_1.Accountant).save(accountant2)];
                    case 8:
                        _a.sent();
                        department = new Department_1.Department();
                        department.name = "Bookkeeping";
                        department.accountants = [accountant1, accountant2];
                        return [4 /*yield*/, connection.getRepository(Department_1.Department).save(department)];
                    case 9:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })); });
    });
});
//# sourceMappingURL=many-to-many.js.map