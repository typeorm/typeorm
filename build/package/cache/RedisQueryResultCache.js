"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisQueryResultCache = void 0;
var tslib_1 = require("tslib");
var PlatformTools_1 = require("../platform/PlatformTools");
/**
 * Caches query result into Redis database.
 */
var RedisQueryResultCache = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RedisQueryResultCache(connection, clientType) {
        this.connection = connection;
        this.clientType = clientType;
        this.redis = this.loadRedis();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a connection with given cache provider.
     */
    RedisQueryResultCache.prototype.connect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cacheOptions;
            return tslib_1.__generator(this, function (_a) {
                cacheOptions = this.connection.options.cache;
                if (this.clientType === "redis") {
                    if (cacheOptions && cacheOptions.options) {
                        this.client = this.redis.createClient(cacheOptions.options);
                    }
                    else {
                        this.client = this.redis.createClient();
                    }
                }
                else if (this.clientType === "ioredis") {
                    if (cacheOptions && cacheOptions.options) {
                        this.client = new this.redis(cacheOptions.options);
                    }
                    else {
                        this.client = new this.redis();
                    }
                }
                else if (this.clientType === "ioredis/cluster") {
                    if (cacheOptions && cacheOptions.options && Array.isArray(cacheOptions.options)) {
                        this.client = new this.redis.Cluster(cacheOptions.options);
                    }
                    else if (cacheOptions && cacheOptions.options && cacheOptions.options.startupNodes) {
                        this.client = new this.redis.Cluster(cacheOptions.options.startupNodes, cacheOptions.options.options);
                    }
                    else {
                        throw new Error("options.startupNodes required for " + this.clientType + ".");
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Disconnects the connection
     */
    RedisQueryResultCache.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        _this.client.quit(function (err, result) {
                            if (err)
                                return fail(err);
                            ok();
                            _this.client = undefined;
                        });
                    })];
            });
        });
    };
    /**
     * Creates table for storing cache if it does not exist yet.
     */
    RedisQueryResultCache.prototype.synchronize = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    RedisQueryResultCache.prototype.getFromCache = function (options, queryRunner) {
        var _this = this;
        return new Promise(function (ok, fail) {
            if (options.identifier) {
                _this.client.get(options.identifier, function (err, result) {
                    if (err)
                        return fail(err);
                    ok(JSON.parse(result));
                });
            }
            else if (options.query) {
                _this.client.get(options.query, function (err, result) {
                    if (err)
                        return fail(err);
                    ok(JSON.parse(result));
                });
            }
            else {
                ok(undefined);
            }
        });
    };
    /**
     * Checks if cache is expired or not.
     */
    RedisQueryResultCache.prototype.isExpired = function (savedCache) {
        return (savedCache.time + savedCache.duration) < new Date().getTime();
    };
    /**
     * Stores given query result in the cache.
     */
    RedisQueryResultCache.prototype.storeInCache = function (options, savedCache, queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        if (options.identifier) {
                            _this.client.set(options.identifier, JSON.stringify(options), "PX", options.duration, function (err, result) {
                                if (err)
                                    return fail(err);
                                ok();
                            });
                        }
                        else if (options.query) {
                            _this.client.set(options.query, JSON.stringify(options), "PX", options.duration, function (err, result) {
                                if (err)
                                    return fail(err);
                                ok();
                            });
                        }
                    })];
            });
        });
    };
    /**
     * Clears everything stored in the cache.
     */
    RedisQueryResultCache.prototype.clear = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        _this.client.flushdb(function (err, result) {
                            if (err)
                                return fail(err);
                            ok();
                        });
                    })];
            });
        });
    };
    /**
     * Removes all cached results by given identifiers from cache.
     */
    RedisQueryResultCache.prototype.remove = function (identifiers, queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(identifiers.map(function (identifier) {
                            return _this.deleteKey(identifier);
                        }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Removes a single key from redis database.
     */
    RedisQueryResultCache.prototype.deleteKey = function (key) {
        var _this = this;
        return new Promise(function (ok, fail) {
            _this.client.del(key, function (err, result) {
                if (err)
                    return fail(err);
                ok();
            });
        });
    };
    /**
     * Loads redis dependency.
     */
    RedisQueryResultCache.prototype.loadRedis = function () {
        try {
            if (this.clientType === "ioredis/cluster") {
                return PlatformTools_1.PlatformTools.load("ioredis");
            }
            else {
                return PlatformTools_1.PlatformTools.load(this.clientType);
            }
        }
        catch (e) {
            throw new Error("Cannot use cache because " + this.clientType + " is not installed. Please run \"npm i " + this.clientType + " --save\".");
        }
    };
    return RedisQueryResultCache;
}());
exports.RedisQueryResultCache = RedisQueryResultCache;

//# sourceMappingURL=RedisQueryResultCache.js.map
