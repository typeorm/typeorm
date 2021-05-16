import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {PostWithOptions} from "./entity/PostWithOptions";
import {PostWithoutTypes} from "./entity/PostWithoutTypes";
import {DateUtils} from "../../../../../src/util/DateUtils";

describe("database schema > column types > sap", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sap"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("all types should work correctly - persist and hydrate", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        const post = new Post();
        post.id = 1;
        post.name = "Post";
        post.int = 2147483647;
        post.integer = 2147483647;
        post.tinyint = 250;
        post.smallint = 32767;
        post.bigint = "8223372036854775807";
        post.decimal = "8223372036854775807";
        post.dec = "8223372036854775807";
        post.smalldecimal = "8223372036854775";
        post.real = 10.5;
        post.double = 10.53;
        post.float = 10.53;
        post.char = "A";
        post.nchar = "A";
        post.varchar = "This is varchar";
        post.nvarchar = "This is nvarchar";
        post.alphanum = "This is alphanum";
        post.text = "This is text";
        post.shorttext = "This is shorttext";
        post.dateObj = new Date();
        post.date = "2017-06-21";
        post.timeObj = new Date();
        post.time = "13:27:05";
        post.timestamp = new Date();
        post.timestamp.setMilliseconds(0);
        post.seconddate = new Date();
        post.seconddate.setMilliseconds(0);
        post.blob = Buffer.from("This is blob");
        post.clob = "This is clob";
        post.nclob = "This is nclob";
        post.boolean = true;
        // post.array = ["A", "B", "C"]; // TODO
        post.varbinary = Buffer.from("This is varbinary");
        post.simpleArray = ["A", "B", "C"];
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOne(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.int.should.be.equal(post.int);
        loadedPost.integer.should.be.equal(post.integer);
        loadedPost.tinyint.should.be.equal(post.tinyint);
        loadedPost.smallint.should.be.equal(post.smallint);
        loadedPost.bigint.should.be.equal(post.bigint);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.dec.should.be.equal(post.dec);
        loadedPost.smalldecimal.should.be.equal(post.smalldecimal);
        loadedPost.real.should.be.equal(post.real);
        loadedPost.double.should.be.equal(post.double);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.char.should.be.equal(post.char);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.alphanum.should.be.equal(post.alphanum);
        loadedPost.text.should.be.equal(post.text);
        loadedPost.shorttext.should.be.equal(post.shorttext);
        loadedPost.dateObj.should.be.equal(DateUtils.mixedDateToDateString(post.dateObj));
        loadedPost.date.should.be.equal(post.date);
        loadedPost.timeObj.valueOf().should.be.equal(DateUtils.mixedTimeToString(post.timeObj));
        loadedPost.time.should.be.equal(post.time);
        loadedPost.timestamp.valueOf().should.be.equal(post.timestamp.valueOf());
        loadedPost.seconddate.valueOf().should.be.equal(post.seconddate.valueOf());
        loadedPost.blob.toString().should.be.equal(post.blob.toString());
        loadedPost.clob.toString().should.be.equal(post.clob.toString());
        loadedPost.nclob.toString().should.be.equal(post.nclob.toString());
        loadedPost.boolean.should.be.equal(post.boolean);
        loadedPost.varbinary.toString().should.be.equal(post.varbinary.toString());
        loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
        loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
        loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);

        table!.findColumnByName("id")!.type.should.be.equal("integer");
        table!.findColumnByName("name")!.type.should.be.equal("nvarchar");
        table!.findColumnByName("int")!.type.should.be.equal("integer");
        table!.findColumnByName("integer")!.type.should.be.equal("integer");
        table!.findColumnByName("tinyint")!.type.should.be.equal("tinyint");
        table!.findColumnByName("smallint")!.type.should.be.equal("smallint");
        table!.findColumnByName("bigint")!.type.should.be.equal("bigint");
        table!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        table!.findColumnByName("dec")!.type.should.be.equal("decimal");
        table!.findColumnByName("real")!.type.should.be.equal("real");
        table!.findColumnByName("double")!.type.should.be.equal("double");
        table!.findColumnByName("float")!.type.should.be.equal("double");
        table!.findColumnByName("char")!.type.should.be.equal("char");
        table!.findColumnByName("nchar")!.type.should.be.equal("nchar");
        table!.findColumnByName("varchar")!.type.should.be.equal("varchar");
        table!.findColumnByName("nvarchar")!.type.should.be.equal("nvarchar");
        table!.findColumnByName("alphanum")!.type.should.be.equal("alphanum");
        table!.findColumnByName("text")!.type.should.be.equal("text");
        table!.findColumnByName("shorttext")!.type.should.be.equal("shorttext");
        table!.findColumnByName("dateObj")!.type.should.be.equal("date");
        table!.findColumnByName("date")!.type.should.be.equal("date");
        table!.findColumnByName("timeObj")!.type.should.be.equal("time");
        table!.findColumnByName("time")!.type.should.be.equal("time");
        table!.findColumnByName("timestamp")!.type.should.be.equal("timestamp");
        table!.findColumnByName("seconddate")!.type.should.be.equal("seconddate");
        table!.findColumnByName("blob")!.type.should.be.equal("blob");
        table!.findColumnByName("clob")!.type.should.be.equal("clob");
        table!.findColumnByName("nclob")!.type.should.be.equal("nclob");
        table!.findColumnByName("boolean")!.type.should.be.equal("boolean");
        table!.findColumnByName("varbinary")!.type.should.be.equal("varbinary");
        table!.findColumnByName("simpleArray")!.type.should.be.equal("text");
    })));

    it("all types should work correctly - persist and hydrate when options are specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithOptions);
        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post_with_options");
        await queryRunner.release();

        const post = new PostWithOptions();
        post.id = 1;
        post.dec = "60.00";
        post.decimal = "70.000";
        post.varchar = "This is varchar";
        post.nvarchar = "This is nvarchar";
        post.alphanum = "This is alphanum";
        post.shorttext = "This is shorttext";
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOne(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.dec.should.be.equal(post.dec);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.alphanum.should.be.equal(post.alphanum);
        loadedPost.shorttext.should.be.equal(post.shorttext);

        table!.findColumnByName("id")!.type.should.be.equal("integer");
        table!.findColumnByName("dec")!.type.should.be.equal("decimal");
        table!.findColumnByName("dec")!.precision!.should.be.equal(10);
        table!.findColumnByName("dec")!.scale!.should.be.equal(2);
        table!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        table!.findColumnByName("decimal")!.precision!.should.be.equal(10);
        table!.findColumnByName("decimal")!.scale!.should.be.equal(3);
        table!.findColumnByName("varchar")!.type.should.be.equal("varchar");
        table!.findColumnByName("varchar")!.length!.should.be.equal("50");
        table!.findColumnByName("nvarchar")!.type.should.be.equal("nvarchar");
        table!.findColumnByName("nvarchar")!.length!.should.be.equal("50");
        table!.findColumnByName("alphanum")!.type.should.be.equal("alphanum");
        table!.findColumnByName("alphanum")!.length!.should.be.equal("50");
        table!.findColumnByName("shorttext")!.type.should.be.equal("shorttext");
        table!.findColumnByName("shorttext")!.length!.should.be.equal("50");

    })));

    it("all types should work correctly - persist and hydrate when types are not specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithoutTypes);
        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post_without_types");
        await queryRunner.release();

        const post = new PostWithoutTypes();
        post.id = 1;
        post.name = "Post";
        post.boolean = true;
        post.blob = Buffer.from("This is blob");
        post.timestamp = new Date();
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOne(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.boolean.should.be.equal(post.boolean);
        loadedPost.blob.toString().should.be.equal(post.blob.toString());
        loadedPost.timestamp.valueOf().should.be.equal(post.timestamp.valueOf());

        table!.findColumnByName("id")!.type.should.be.equal("integer");
        table!.findColumnByName("name")!.type.should.be.equal("nvarchar");
        table!.findColumnByName("boolean")!.type.should.be.equal("boolean");
        table!.findColumnByName("blob")!.type.should.be.equal("blob");
        table!.findColumnByName("timestamp")!.type.should.be.equal("timestamp");

    })));

});
