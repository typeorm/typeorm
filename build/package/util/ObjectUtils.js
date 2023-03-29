"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectUtils = void 0;
var tslib_1 = require("tslib");
var ObjectUtils = /** @class */ (function () {
    function ObjectUtils() {
    }
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param sources One or more source objects from which to copy properties
     */
    ObjectUtils.assign = function (target) {
        var e_1, _a, e_2, _b;
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        try {
            for (var sources_1 = tslib_1.__values(sources), sources_1_1 = sources_1.next(); !sources_1_1.done; sources_1_1 = sources_1.next()) {
                var source = sources_1_1.value;
                try {
                    for (var _c = (e_2 = void 0, tslib_1.__values(Object.getOwnPropertyNames(source))), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var prop = _d.value;
                        target[prop] = source[prop];
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (sources_1_1 && !sources_1_1.done && (_a = sources_1.return)) _a.call(sources_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    return ObjectUtils;
}());
exports.ObjectUtils = ObjectUtils;

//# sourceMappingURL=ObjectUtils.js.map
