"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var View = /** @class */ (function () {
    function View() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], View.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ transformer: [] }),
        tslib_1.__metadata("design:type", String)
    ], View.prototype, "title", void 0);
    View = tslib_1.__decorate([
        src_1.Entity()
    ], View);
    return View;
}());
exports.View = View;
//# sourceMappingURL=View.js.map