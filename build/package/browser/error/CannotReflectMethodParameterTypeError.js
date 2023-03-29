import { __extends } from "tslib";
/**
 * Thrown when ORM cannot get method parameter's type.
 * Basically, when reflect-metadata is not available or tsconfig is not properly setup.
 */
var CannotReflectMethodParameterTypeError = /** @class */ (function (_super) {
    __extends(CannotReflectMethodParameterTypeError, _super);
    function CannotReflectMethodParameterTypeError(target, methodName) {
        var _this = _super.call(this) || this;
        _this.name = "CannotReflectMethodParameterTypeError";
        Object.setPrototypeOf(_this, CannotReflectMethodParameterTypeError.prototype);
        _this.message = "Cannot get reflected type for a \"" + methodName + "\" method's parameter of \"" + target.name + "\" class. " +
            "Make sure you have turned on an \"emitDecoratorMetadata\": true option in tsconfig.json. " +
            "Also make sure you have imported \"reflect-metadata\" on top of the main entry file in your application.";
        return _this;
    }
    return CannotReflectMethodParameterTypeError;
}(Error));
export { CannotReflectMethodParameterTypeError };

//# sourceMappingURL=CannotReflectMethodParameterTypeError.js.map
