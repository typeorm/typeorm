"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Ticket_1 = require("./entity/Ticket");
var Request_1 = require("./entity/Request");
var chai_1 = require("chai");
describe("github issues > #161 joinAndSelect can't find entity from inverse side of relation", function () {
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
    it("should persist successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var request, ticket, loadedTicketWithRequest, loadedRequestWithTicket;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    request = new Request_1.Request();
                    request.owner = "Umed";
                    request.type = "ticket";
                    request.success = false;
                    ticket = new Ticket_1.Ticket();
                    ticket.name = "ticket #1";
                    ticket.request = request;
                    return [4 /*yield*/, connection.manager.save(ticket)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Ticket_1.Ticket, 1, {
                            join: {
                                alias: "ticket",
                                innerJoinAndSelect: {
                                    "request": "ticket.request"
                                }
                            }
                        })];
                case 2:
                    loadedTicketWithRequest = _a.sent();
                    chai_1.expect(loadedTicketWithRequest).not.to.be.undefined;
                    loadedTicketWithRequest.should.be.eql({
                        id: 1,
                        name: "ticket #1",
                        request: {
                            id: 1,
                            owner: "Umed",
                            type: "ticket",
                            success: false
                        }
                    });
                    return [4 /*yield*/, connection.manager.findOne(Request_1.Request, 1, {
                            join: {
                                alias: "request",
                                innerJoinAndSelect: {
                                    "ticket": "request.ticket"
                                }
                            }
                        })];
                case 3:
                    loadedRequestWithTicket = _a.sent();
                    loadedRequestWithTicket.should.be.eql({
                        id: 1,
                        owner: "Umed",
                        type: "ticket",
                        success: false,
                        ticket: {
                            id: 1,
                            name: "ticket #1"
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should return joined relation successfully", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var authRequest, request, ticket, loadedRequest;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authRequest = new Request_1.Request();
                    authRequest.owner = "somebody";
                    authRequest.type = "authenticate";
                    authRequest.success = true;
                    return [4 /*yield*/, connection.manager.save(authRequest)];
                case 1:
                    _a.sent();
                    request = new Request_1.Request();
                    request.owner = "somebody";
                    request.type = "ticket";
                    request.success = true;
                    ticket = new Ticket_1.Ticket();
                    ticket.name = "USD PAYMENT";
                    ticket.request = request;
                    request.ticket = ticket;
                    return [4 /*yield*/, connection.manager.save(ticket)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Request_1.Request, 2, {
                            join: {
                                alias: "request",
                                innerJoinAndSelect: { ticket: "request.ticket" }
                            }
                        })];
                case 3:
                    loadedRequest = _a.sent();
                    chai_1.expect(loadedRequest).not.to.be.undefined;
                    loadedRequest.should.be.eql({
                        id: 2,
                        owner: "somebody",
                        type: "ticket",
                        success: true,
                        ticket: {
                            id: 1,
                            name: "USD PAYMENT"
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-161.js.map