"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplyValueTransformers = void 0;
var ApplyValueTransformers = /** @class */ (function () {
    function ApplyValueTransformers() {
    }
    ApplyValueTransformers.transformFrom = function (transformer, databaseValue) {
        if (Array.isArray(transformer)) {
            var reverseTransformers = transformer.slice().reverse();
            return reverseTransformers.reduce(function (transformedValue, _transformer) {
                return _transformer.from(transformedValue);
            }, databaseValue);
        }
        return transformer.from(databaseValue);
    };
    ApplyValueTransformers.transformTo = function (transformer, entityValue) {
        if (Array.isArray(transformer)) {
            return transformer.reduce(function (transformedValue, _transformer) {
                return _transformer.to(transformedValue);
            }, entityValue);
        }
        return transformer.to(entityValue);
    };
    return ApplyValueTransformers;
}());
exports.ApplyValueTransformers = ApplyValueTransformers;

//# sourceMappingURL=ApplyValueTransformers.js.map
