let _Shim: any;
try {
    // We're in /test
    _Shim = require("../../../../extra/typeorm-model-shim");
} catch (e) {
    // We're in /build/compiled/test
    _Shim = require("../../../../../extra/typeorm-model-shim");
}

export const Shim = _Shim;
