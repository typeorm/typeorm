"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverUtils = void 0;
var tslib_1 = require("tslib");
var StringUtils_1 = require("../util/StringUtils");
/**
 * Common driver utility functions.
 */
var DriverUtils = /** @class */ (function () {
    function DriverUtils() {
    }
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------
    /**
     * Normalizes and builds a new driver options.
     * Extracts settings from connection url and sets to a new options object.
     */
    DriverUtils.buildDriverOptions = function (options, buildOptions) {
        var e_1, _a;
        if (options.url) {
            var urlDriverOptions = this.parseConnectionUrl(options.url);
            if (buildOptions && buildOptions.useSid && urlDriverOptions.database) {
                urlDriverOptions.sid = urlDriverOptions.database;
            }
            try {
                for (var _b = tslib_1.__values(Object.keys(urlDriverOptions)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    if (typeof urlDriverOptions[key] === "undefined") {
                        delete urlDriverOptions[key];
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return Object.assign({}, options, urlDriverOptions);
        }
        return Object.assign({}, options);
    };
    /**
     * buildDriverOptions for MongodDB only to support replica set
     */
    DriverUtils.buildMongoDBDriverOptions = function (options, buildOptions) {
        var e_2, _a;
        if (options.url) {
            var urlDriverOptions = this.parseMongoDBConnectionUrl(options.url);
            if (buildOptions && buildOptions.useSid && urlDriverOptions.database) {
                urlDriverOptions.sid = urlDriverOptions.database;
            }
            try {
                for (var _b = tslib_1.__values(Object.keys(urlDriverOptions)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    if (typeof urlDriverOptions[key] === "undefined") {
                        delete urlDriverOptions[key];
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return Object.assign({}, options, urlDriverOptions);
        }
        return Object.assign({}, options);
    };
    /**
     * Builds column alias from given alias name and column name.
     *
     * If alias length is greater than the limit (if any) allowed by the current
     * driver, replaces it with a hashed string.
     *
     * @param driver Current `Driver`.
     * @param alias Alias part.
     * @param column Name of the column to be concatened to `alias`.
     *
     * @return An alias allowing to select/transform the target `column`.
     */
    DriverUtils.buildColumnAlias = function (_a, alias, column) {
        var maxAliasLength = _a.maxAliasLength;
        var columnAliasName = alias + "_" + column;
        if (maxAliasLength && maxAliasLength > 0 && columnAliasName.length > maxAliasLength) {
            return StringUtils_1.hash(columnAliasName, { length: maxAliasLength });
        }
        return columnAliasName;
    };
    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------
    /**
     * Extracts connection data from the connection url.
     */
    DriverUtils.parseConnectionUrl = function (url) {
        var type = url.split(":")[0];
        var firstSlashes = url.indexOf("//");
        var preBase = url.substr(firstSlashes + 2);
        var secondSlash = preBase.indexOf("/");
        var base = (secondSlash !== -1) ? preBase.substr(0, secondSlash) : preBase;
        var afterBase = (secondSlash !== -1) ? preBase.substr(secondSlash + 1) : undefined;
        // remove mongodb query params
        if (afterBase && afterBase.indexOf("?") !== -1) {
            afterBase = afterBase.substr(0, afterBase.indexOf("?"));
        }
        var lastAtSign = base.lastIndexOf("@");
        var usernameAndPassword = base.substr(0, lastAtSign);
        var hostAndPort = base.substr(lastAtSign + 1);
        var username = usernameAndPassword;
        var password = "";
        var firstColon = usernameAndPassword.indexOf(":");
        if (firstColon !== -1) {
            username = usernameAndPassword.substr(0, firstColon);
            password = usernameAndPassword.substr(firstColon + 1);
        }
        var _a = tslib_1.__read(hostAndPort.split(":"), 2), host = _a[0], port = _a[1];
        return {
            type: type,
            host: host,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined
        };
    };
    /**
     * Extracts connection data from the connection url for MongoDB to support replica set.
     */
    DriverUtils.parseMongoDBConnectionUrl = function (url) {
        var _a;
        var type = url.split(":")[0];
        var firstSlashes = url.indexOf("//");
        var preBase = url.substr(firstSlashes + 2);
        var secondSlash = preBase.indexOf("/");
        var base = (secondSlash !== -1) ? preBase.substr(0, secondSlash) : preBase;
        var afterBase = (secondSlash !== -1) ? preBase.substr(secondSlash + 1) : undefined;
        var afterQuestionMark = "";
        var host = undefined;
        var port = undefined;
        var hostReplicaSet = undefined;
        var replicaSet = undefined;
        // remove mongodb query params
        if (afterBase && afterBase.indexOf("?") !== -1) {
            // split params to get replica set
            afterQuestionMark = afterBase.substr((afterBase.indexOf("?") + 1), afterBase.length);
            replicaSet = afterQuestionMark.split("=")[1];
            afterBase = afterBase.substr(0, afterBase.indexOf("?"));
        }
        var lastAtSign = base.lastIndexOf("@");
        var usernameAndPassword = base.substr(0, lastAtSign);
        var hostAndPort = base.substr(lastAtSign + 1);
        var username = usernameAndPassword;
        var password = "";
        var firstColon = usernameAndPassword.indexOf(":");
        if (firstColon !== -1) {
            username = usernameAndPassword.substr(0, firstColon);
            password = usernameAndPassword.substr(firstColon + 1);
        }
        if (replicaSet) {
            hostReplicaSet = hostAndPort;
        }
        else {
            _a = tslib_1.__read(hostAndPort.split(":"), 2), host = _a[0], port = _a[1];
        }
        return {
            type: type,
            host: host,
            hostReplicaSet: hostReplicaSet,
            username: decodeURIComponent(username),
            password: decodeURIComponent(password),
            port: port ? parseInt(port) : undefined,
            database: afterBase || undefined,
            replicaSet: replicaSet || undefined
        };
    };
    return DriverUtils;
}());
exports.DriverUtils = DriverUtils;

//# sourceMappingURL=DriverUtils.js.map
