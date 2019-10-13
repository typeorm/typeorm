"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var BasePost_1 = require("./BasePost");
var PostAuthor_1 = require("./PostAuthor");
var ManyToOne_1 = require("../../../src/decorator/relations/ManyToOne");
var PrimaryColumn_1 = require("../../../src/decorator/columns/PrimaryColumn");
var Generated_1 = require("../../../src/decorator/Generated");
var BaseObject = /** @class */ (function (_super) {
    tslib_1.__extends(BaseObject, _super);
    function BaseObject() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("double"),
        Generated_1.Generated(),
        tslib_1.__metadata("design:type", Number)
    ], BaseObject.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], BaseObject.prototype, "title", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return PostAuthor_1.PostAuthor; }, function (post) { return post.posts; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", PostAuthor_1.PostAuthor)
    ], BaseObject.prototype, "author", void 0);
    return BaseObject;
}(BasePost_1.BasePost));
exports.BaseObject = BaseObject;
//# sourceMappingURL=BaseObject.js.map