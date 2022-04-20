var VersionUtils = /** @class */ (function () {
    function VersionUtils() {
    }
    VersionUtils.isGreaterOrEqual = function (version, targetVersion) {
        var v1 = parseVersion(version);
        var v2 = parseVersion(targetVersion);
        return v1[0] > v2[0] ||
            v1[0] === v2[0] && v1[1] > v2[1] ||
            v1[0] === v2[0] && v1[1] === v2[1] && v1[2] >= v2[2];
    };
    return VersionUtils;
}());
export { VersionUtils };
function parseVersion(version) {
    if (version === void 0) { version = ""; }
    var v = [0, 0, 0];
    version.split(".").forEach(function (value, i) { return v[i] = parseInt(value, 10); });
    return v;
}

//# sourceMappingURL=VersionUtils.js.map
