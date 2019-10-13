"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var PostWithOptions_1 = require("./entity/PostWithOptions");
var PostWithoutTypes_1 = require("./entity/PostWithoutTypes");
describe("database schema > column types > cockroachdb", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["cockroachdb"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("all types should work correctly - persist and hydrate", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, queryRunner, table, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    post = new Post_1.Post();
                    post.id = 1;
                    post.name = "Post";
                    post.integer = "2147483647";
                    post.int4 = "2147483647";
                    post.int = "2147483647";
                    post.smallint = "32767";
                    post.int2 = "32767";
                    post.bigint = "8223372036854775807";
                    post.int8 = "8223372036854775807";
                    post.int64 = "8223372036854775807";
                    post.doublePrecision = 15.357;
                    post.float8 = 15.357;
                    post.real = 5.5;
                    post.float4 = 5.5;
                    post.numeric = "50";
                    post.decimal = "50";
                    post.dec = "50";
                    post.char = "A";
                    post.character = "A";
                    post.varchar = "This is varchar";
                    post.charVarying = "This is char varying";
                    post.characterVarying = "This is character varying";
                    post.text = "This is text";
                    post.string = "This is string";
                    post.bytes = Buffer.alloc(13, "This is bytes");
                    post.bytea = Buffer.alloc(13, "This is bytea");
                    post.blob = Buffer.alloc(12, "This is blob");
                    post.date = "2017-06-21";
                    post.interval = "1 year 2 months 3 days 4 hours 5 minutes 6 seconds";
                    post.time = "05:40:00.000001";
                    post.timeWithoutTimeZone = "05:40:00.000001";
                    post.timestamp = new Date();
                    post.timestamp.setMilliseconds(0);
                    post.timestampWithTimeZone = new Date();
                    post.timestampWithTimeZone.setMilliseconds(0);
                    post.timestampWithoutTimeZone = new Date();
                    post.timestampWithoutTimeZone.setMilliseconds(0);
                    post.timestamptz = new Date();
                    post.timestamptz.setMilliseconds(0);
                    post.boolean = true;
                    post.bool = false;
                    post.inet = "192.168.100.128";
                    post.uuid = "0e37df36-f698-11e6-8dd4-cb9ced3df976";
                    post.jsonb = { id: 1, name: "Post" };
                    post.json = { id: 1, name: "Post" };
                    post.array = ["1", "2", "3"];
                    post.simpleArray = ["A", "B", "C"];
                    post.simpleJson = { param: "VALUE" };
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 4:
                    loadedPost = (_a.sent());
                    loadedPost.id.should.be.equal(post.id);
                    loadedPost.name.should.be.equal(post.name);
                    loadedPost.integer.should.be.equal(post.integer);
                    loadedPost.int4.should.be.equal(post.int4);
                    loadedPost.int.should.be.equal(post.int);
                    loadedPost.smallint.should.be.equal(post.smallint);
                    loadedPost.int2.should.be.equal(post.int2);
                    loadedPost.bigint.should.be.equal(post.bigint);
                    loadedPost.int8.should.be.equal(post.int8);
                    loadedPost.int64.should.be.equal(post.int64);
                    loadedPost.doublePrecision.should.be.equal(post.doublePrecision);
                    loadedPost.float8.should.be.equal(post.float8);
                    loadedPost.real.should.be.equal(post.real);
                    loadedPost.float4.should.be.equal(post.float4);
                    loadedPost.numeric.should.be.equal(post.numeric);
                    loadedPost.decimal.should.be.equal(post.decimal);
                    loadedPost.dec.should.be.equal(post.dec);
                    loadedPost.char.should.be.equal(post.char);
                    loadedPost.character.should.be.equal(post.character);
                    loadedPost.varchar.should.be.equal(post.varchar);
                    loadedPost.characterVarying.should.be.equal(post.characterVarying);
                    loadedPost.text.should.be.equal(post.text);
                    loadedPost.bytes.toString().should.be.equal(post.bytes.toString());
                    loadedPost.bytea.toString().should.be.equal(post.bytea.toString());
                    loadedPost.blob.toString().should.be.equal(post.blob.toString());
                    loadedPost.date.should.be.equal(post.date);
                    // loadedPost.interval.years.should.be.equal(1);
                    // loadedPost.interval.months.should.be.equal(2);
                    // loadedPost.interval.days.should.be.equal(3);
                    // loadedPost.interval.hours.should.be.equal(4);
                    // loadedPost.interval.minutes.should.be.equal(5);
                    // loadedPost.interval.seconds.should.be.equal(6);
                    loadedPost.time.should.be.equal(post.time);
                    loadedPost.timeWithoutTimeZone.should.be.equal(post.timeWithoutTimeZone);
                    loadedPost.timestamp.valueOf().should.be.equal(post.timestamp.valueOf());
                    loadedPost.timestampWithTimeZone.getTime().should.be.equal(post.timestampWithTimeZone.getTime());
                    loadedPost.timestampWithoutTimeZone.getTime().should.be.equal(post.timestampWithoutTimeZone.getTime());
                    loadedPost.timestamptz.valueOf().should.be.equal(post.timestamptz.valueOf());
                    loadedPost.boolean.should.be.equal(post.boolean);
                    loadedPost.bool.should.be.equal(post.bool);
                    loadedPost.inet.should.be.equal(post.inet);
                    loadedPost.uuid.should.be.eql(post.uuid);
                    loadedPost.jsonb.should.be.eql(post.jsonb);
                    loadedPost.json.should.be.eql(post.json);
                    loadedPost.array[0].should.be.equal(post.array[0]);
                    loadedPost.array[1].should.be.equal(post.array[1]);
                    loadedPost.array[2].should.be.equal(post.array[2]);
                    loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
                    loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
                    loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);
                    loadedPost.simpleJson.param.should.be.equal(post.simpleJson.param);
                    table.findColumnByName("id").type.should.be.equal("int8");
                    table.findColumnByName("name").type.should.be.equal("varchar");
                    table.findColumnByName("integer").type.should.be.equal("int8");
                    table.findColumnByName("int4").type.should.be.equal("int4");
                    table.findColumnByName("int").type.should.be.equal("int8");
                    table.findColumnByName("smallint").type.should.be.equal("int2");
                    table.findColumnByName("int2").type.should.be.equal("int2");
                    table.findColumnByName("bigint").type.should.be.equal("int8");
                    table.findColumnByName("int8").type.should.be.equal("int8");
                    table.findColumnByName("int64").type.should.be.equal("int8");
                    table.findColumnByName("doublePrecision").type.should.be.equal("float8");
                    table.findColumnByName("float8").type.should.be.equal("float8");
                    table.findColumnByName("real").type.should.be.equal("float4");
                    table.findColumnByName("float4").type.should.be.equal("float4");
                    table.findColumnByName("numeric").type.should.be.equal("decimal");
                    table.findColumnByName("decimal").type.should.be.equal("decimal");
                    table.findColumnByName("dec").type.should.be.equal("decimal");
                    table.findColumnByName("char").type.should.be.equal("char");
                    table.findColumnByName("character").type.should.be.equal("char");
                    table.findColumnByName("varchar").type.should.be.equal("varchar");
                    table.findColumnByName("characterVarying").type.should.be.equal("varchar");
                    table.findColumnByName("charVarying").type.should.be.equal("varchar");
                    table.findColumnByName("text").type.should.be.equal("string");
                    table.findColumnByName("string").type.should.be.equal("string");
                    table.findColumnByName("bytes").type.should.be.equal("bytes");
                    table.findColumnByName("bytea").type.should.be.equal("bytes");
                    table.findColumnByName("blob").type.should.be.equal("bytes");
                    table.findColumnByName("date").type.should.be.equal("date");
                    table.findColumnByName("interval").type.should.be.equal("interval");
                    table.findColumnByName("time").type.should.be.equal("time");
                    table.findColumnByName("timeWithoutTimeZone").type.should.be.equal("time");
                    table.findColumnByName("timestamp").type.should.be.equal("timestamp");
                    table.findColumnByName("timestampWithTimeZone").type.should.be.equal("timestamptz");
                    table.findColumnByName("timestampWithoutTimeZone").type.should.be.equal("timestamp");
                    table.findColumnByName("timestamptz").type.should.be.equal("timestamptz");
                    table.findColumnByName("boolean").type.should.be.equal("bool");
                    table.findColumnByName("bool").type.should.be.equal("bool");
                    table.findColumnByName("inet").type.should.be.equal("inet");
                    table.findColumnByName("uuid").type.should.be.equal("uuid");
                    table.findColumnByName("jsonb").type.should.be.equal("jsonb");
                    table.findColumnByName("json").type.should.be.equal("jsonb");
                    table.findColumnByName("array").type.should.be.equal("int8");
                    table.findColumnByName("array").isArray.should.be.true;
                    table.findColumnByName("simpleArray").type.should.be.equal("string");
                    table.findColumnByName("simpleJson").type.should.be.equal("string");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("all types should work correctly - persist and hydrate when options are specified on columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, queryRunner, table, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(PostWithOptions_1.PostWithOptions);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post_with_options")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    post = new PostWithOptions_1.PostWithOptions();
                    post.id = 1;
                    post.numeric = "50.00";
                    post.decimal = "50.00";
                    post.dec = "50.00";
                    post.char = "AAA";
                    post.character = "AAA";
                    post.varchar = "This is varchar";
                    post.characterVarying = "This is character varying";
                    post.charVarying = "This is char varying";
                    post.string = "This is string";
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 4:
                    loadedPost = (_a.sent());
                    loadedPost.id.should.be.equal(post.id);
                    loadedPost.numeric.should.be.equal(post.numeric);
                    loadedPost.decimal.should.be.equal(post.decimal);
                    loadedPost.char.should.be.equal(post.char);
                    loadedPost.character.should.be.equal(post.character);
                    loadedPost.varchar.should.be.equal(post.varchar);
                    loadedPost.characterVarying.should.be.equal(post.characterVarying);
                    loadedPost.charVarying.should.be.equal(post.charVarying);
                    loadedPost.string.should.be.equal(post.string);
                    table.findColumnByName("id").type.should.be.equal("int8");
                    table.findColumnByName("numeric").type.should.be.equal("decimal");
                    table.findColumnByName("numeric").precision.should.be.equal(5);
                    table.findColumnByName("numeric").scale.should.be.equal(2);
                    table.findColumnByName("decimal").type.should.be.equal("decimal");
                    table.findColumnByName("decimal").precision.should.be.equal(5);
                    table.findColumnByName("decimal").scale.should.be.equal(2);
                    table.findColumnByName("dec").type.should.be.equal("decimal");
                    table.findColumnByName("dec").precision.should.be.equal(5);
                    table.findColumnByName("dec").scale.should.be.equal(2);
                    table.findColumnByName("char").type.should.be.equal("char");
                    table.findColumnByName("char").length.should.be.equal("3");
                    table.findColumnByName("character").type.should.be.equal("char");
                    table.findColumnByName("character").length.should.be.equal("3");
                    table.findColumnByName("varchar").type.should.be.equal("varchar");
                    table.findColumnByName("varchar").length.should.be.equal("30");
                    table.findColumnByName("characterVarying").type.should.be.equal("varchar");
                    table.findColumnByName("characterVarying").length.should.be.equal("30");
                    table.findColumnByName("charVarying").type.should.be.equal("varchar");
                    table.findColumnByName("charVarying").length.should.be.equal("30");
                    table.findColumnByName("string").type.should.be.equal("string");
                    table.findColumnByName("string").length.should.be.equal("30");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("all types should work correctly - persist and hydrate when types are not specified on columns", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, queryRunner, table, post, loadedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(PostWithoutTypes_1.PostWithoutTypes);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post_without_types")];
                case 1:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _a.sent();
                    post = new PostWithoutTypes_1.PostWithoutTypes();
                    post.id = 1;
                    post.name = "Post";
                    post.boolean = true;
                    post.datetime = new Date();
                    post.datetime.setMilliseconds(0);
                    return [4 /*yield*/, postRepository.save(post)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 4:
                    loadedPost = (_a.sent());
                    loadedPost.id.should.be.equal(post.id);
                    loadedPost.name.should.be.equal(post.name);
                    loadedPost.boolean.should.be.equal(post.boolean);
                    loadedPost.datetime.valueOf().should.be.equal(post.datetime.valueOf());
                    table.findColumnByName("id").type.should.be.equal("int8");
                    table.findColumnByName("name").type.should.be.equal("varchar");
                    table.findColumnByName("boolean").type.should.be.equal("bool");
                    table.findColumnByName("datetime").type.should.be.equal("timestamp");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=column-types-cockroach.js.map