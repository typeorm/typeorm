"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var encode = {
    to: function (entityValue) {
        return encodeURI(entityValue);
    },
    from: function (databaseValue) {
        return decodeURI(databaseValue);
    },
};
exports.encrypt = {
    to: function (entityValue) {
        return Buffer.from(entityValue).toString("base64");
    },
    from: function (databaseValue) {
        return Buffer.from(databaseValue, "base64").toString();
    },
};
exports.lowercase = {
    to: function (entityValue) {
        return entityValue.toLocaleLowerCase();
    },
    from: function (databaseValue) {
        return databaseValue;
    }
};
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ transformer: [exports.lowercase, encode, exports.encrypt] }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "email", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map