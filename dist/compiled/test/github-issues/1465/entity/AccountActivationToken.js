"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var TableInheritance_1 = require("../../../../src/decorator/entity/TableInheritance");
var Token_1 = require("./Token");
var index_1 = require("../../../../src/index");
var Account_1 = require("./Account");
var AccountActivationToken = /** @class */ (function (_super) {
    tslib_1.__extends(AccountActivationToken, _super);
    function AccountActivationToken(tokenSecret, expiresOn) {
        var _this = _super.call(this) || this;
        _this.tokenSecret = tokenSecret;
        _this.expiresOn = expiresOn;
        return _this;
    }
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return Account_1.Account; }, "accountActivationToken", {
            cascade: ["insert", "update"]
        }),
        index_1.JoinColumn(),
        tslib_1.__metadata("design:type", Account_1.Account)
    ], AccountActivationToken.prototype, "account", void 0);
    AccountActivationToken = tslib_1.__decorate([
        Entity_1.Entity(),
        TableInheritance_1.TableInheritance({ column: { type: "varchar", name: "type" } }),
        tslib_1.__metadata("design:paramtypes", [String, Date])
    ], AccountActivationToken);
    return AccountActivationToken;
}(Token_1.Token));
exports.AccountActivationToken = AccountActivationToken;
//# sourceMappingURL=AccountActivationToken.js.map