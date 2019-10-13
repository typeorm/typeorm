"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var AccountActivationToken_1 = require("./AccountActivationToken");
var index_1 = require("../../../../src/index");
var Account = /** @class */ (function () {
    function Account() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Account.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return AccountActivationToken_1.AccountActivationToken; }, "account", { cascade: ["insert", "remove"] }),
        tslib_1.__metadata("design:type", AccountActivationToken_1.AccountActivationToken)
    ], Account.prototype, "accountActivationToken", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Account.prototype, "username", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Account.prototype, "password", void 0);
    Account = tslib_1.__decorate([
        Entity_1.Entity()
    ], Account);
    return Account;
}());
exports.Account = Account;
//# sourceMappingURL=Account.js.map