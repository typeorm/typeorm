"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Student_1 = require("./entity/Student");
var Employee_1 = require("./entity/Employee");
var Person_1 = require("./entity/Person");
describe("table-inheritance > single-table > non-virtual-discriminator-column", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return non virtual discriminator column as well", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var student, employee, persons;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    student = new Student_1.Student();
                    student.name = "Alice";
                    student.faculty = "Economics";
                    return [4 /*yield*/, connection.getRepository(Student_1.Student).save(student)];
                case 1:
                    _a.sent();
                    employee = new Employee_1.Employee();
                    employee.name = "Roger";
                    employee.salary = 1000;
                    return [4 /*yield*/, connection.getRepository(Employee_1.Employee).save(employee)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Person_1.Person, "person")
                            .getMany()];
                case 3:
                    persons = _a.sent();
                    persons[0].id.should.be.equal(1);
                    persons[0].type.should.be.equal("student-type");
                    persons[0].name.should.be.equal("Alice");
                    persons[0].faculty.should.be.equal("Economics");
                    persons[1].id.should.be.equal(2);
                    persons[1].type.should.be.equal("employee-type");
                    persons[1].name.should.be.equal("Roger");
                    persons[1].salary.should.be.equal(1000);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=non-virtual-discriminator-column.js.map