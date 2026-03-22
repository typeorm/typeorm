let _Shim: any
try {
    // Running from TypeScript sources under /test/github-issues/4219
    _Shim = require("../../../extra/typeorm-class-transformer-shim")
} catch {
    // Running from compiled files under /build/compiled/test/github-issues/4219
    _Shim = require("../../../../../extra/typeorm-class-transformer-shim")
}

export const Shim = _Shim
