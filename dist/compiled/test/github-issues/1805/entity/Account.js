"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Account = /** @class */ (function (_super) {
    tslib_1.__extends(Account, _super);
    function Account() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn("bigint"),
        tslib_1.__metadata("design:type", String)
    ], Account.prototype, "id", void 0);
    Account = tslib_1.__decorate([
        src_1.Entity("accounts")
    ], Account);
    return Account;
}(src_1.BaseEntity));
exports.Account = Account;
//# sourceMappingURL=Account.js.map