"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        if (options.url) {
            var parsedUrl = this.parseConnectionUrl(options.url);
            var urlDriverOptions = {
                type: parsedUrl.type,
                host: parsedUrl.host,
                username: parsedUrl.username,
                password: parsedUrl.password,
                port: parsedUrl.port,
                database: parsedUrl.database
            };
            if (buildOptions && buildOptions.useSid) {
                urlDriverOptions.sid = parsedUrl.database;
            }
            return Object.assign({}, options, urlDriverOptions);
        }
        return Object.assign({}, options);
    };
    /**
     * Builds column alias from given alias name and column name,
     * If alias length is greater than the limit (if any) allowed by the current
     * driver, abbreviates the longest part (alias or column name) in the resulting
     * alias.
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
        if (maxAliasLength && maxAliasLength > 0 && columnAliasName.length > maxAliasLength)
            return alias.length > column.length
                ? StringUtils_1.shorten(alias) + "_" + column
                : alias + "_" + StringUtils_1.shorten(column);
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
    return DriverUtils;
}());
exports.DriverUtils = DriverUtils;
//# sourceMappingURL=DriverUtils.js.map