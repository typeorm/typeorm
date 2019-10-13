"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Employee_1 = require("./entity/Employee");
var Person_1 = require("./entity/Person");
describe("github issues > #184 [Postgres] Single-Inheritance not working with integer type field", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("single table inheritance should accept a Integer Type", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var employeeRepository, employee, personRepository, employee2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    employeeRepository = connection.getRepository(Employee_1.Employee);
                    employee = new Employee_1.Employee();
                    employee.id = "1";
                    employee.firstName = "umed";
                    employee.lastName = "khudoiberdiev";
                    employee.salary = 200000;
                    employee.shared = "e";
                    return [4 /*yield*/, employeeRepository.save(employee)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, employeeRepository.findOne(1)];
                case 2:
                    _a.sent();
                    personRepository = connection.getRepository(Person_1.Person);
                    employee2 = new Employee_1.Employee();
                    employee2.id = "1";
                    employee2.firstName = "umed";
                    employee2.lastName = "khudoiberdiev";
                    employee2.salary = 200000;
                    employee2.shared = "e";
                    return [4 /*yield*/, personRepository.save(employee2)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-184.js.map