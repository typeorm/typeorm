"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WrappedNumber = /** @class */ (function () {
    function WrappedNumber(wrapped) {
        this.wrapped = wrapped;
    }
    WrappedNumber.prototype.getWrapped = function () {
        return this.wrapped;
    };
    return WrappedNumber;
}());
exports.WrappedNumber = WrappedNumber;
exports.transformer = {
    lastValue: undefined,
    from: function (val) {
        return new WrappedNumber(val);
    },
    to: function (w) {
        exports.transformer.lastValue = w;
        return w.getWrapped();
    }
};
//# sourceMappingURL=transformer.js.map