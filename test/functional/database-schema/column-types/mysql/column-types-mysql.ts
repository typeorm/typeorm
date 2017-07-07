import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {PostWithOptions} from "./entity/PostWithOptions";

describe("database schema > column types > mysql", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchemaOnConnection: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("all types should work correctly - persist and hydrate", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.loadTableSchema("post");
        await queryRunner.release();

        const post = new Post();
        post.id = "1";
        post.name = "Post";
        post.int = 2147483647;
        post.tinyint = 127;
        post.smallint = 32767;
        post.mediumint = 8388607;
        post.bigint = 8223372036854775807;
        post.float = 10.53;
        post.double = 10.1234;
        post.decimal = 50;
        post.date = "2017-06-21";
        post.datetime = new Date();
        post.datetime.setMilliseconds(0);
        post.timestamp = new Date();
        post.timestamp.setMilliseconds(0);
        post.time = "15:30:00";
        post.year = 2017;
        post.char = "A";
        post.varchar = "This is varchar";
        post.blob = new Buffer("This is blob");
        post.text = "This is text";
        post.tinyblob = new Buffer("This is tinyblob");
        post.tinytext = "This is tinytext";
        post.mediumblob = new Buffer("This is mediumblob");
        post.mediumtext = "This is mediumtext";
        post.longblob = new Buffer("This is longblob");
        post.longtext = "This is longtext";
        post.enum = "A";
        post.simpleArray = ["A", "B", "C"];
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOneById(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.int.should.be.equal(post.int);
        loadedPost.tinyint.should.be.equal(post.tinyint);
        loadedPost.smallint.should.be.equal(post.smallint);
        loadedPost.mediumint.should.be.equal(post.mediumint);
        loadedPost.bigint.should.be.equal(post.bigint);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.double.should.be.equal(post.double);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.date.should.be.equal(post.date);
        loadedPost.datetime.getTime().should.be.equal(post.datetime.getTime());
        loadedPost.timestamp.getTime().should.be.equal(post.timestamp.getTime());
        loadedPost.time.should.be.equal(post.time);
        loadedPost.year.should.be.equal(post.year);
        loadedPost.char.should.be.equal(post.char);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.blob.toString().should.be.equal(post.blob.toString());
        loadedPost.text.should.be.equal(post.text);
        loadedPost.tinyblob.toString().should.be.equal(post.tinyblob.toString());
        loadedPost.tinytext.should.be.equal(post.tinytext);
        loadedPost.mediumblob.toString().should.be.equal(post.mediumblob.toString());
        loadedPost.mediumtext.should.be.equal(post.mediumtext);
        loadedPost.longblob.toString().should.be.equal(post.longblob.toString());
        loadedPost.longtext.should.be.equal(post.longtext);
        loadedPost.enum.should.be.equal(post.enum);
        loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
        loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
        loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("int")!.type.should.be.equal("int(11)");
        tableSchema!.findColumnByName("tinyint")!.type.should.be.equal("tinyint(4)");
        tableSchema!.findColumnByName("smallint")!.type.should.be.equal("smallint(5)");
        tableSchema!.findColumnByName("mediumint")!.type.should.be.equal("mediumint(9)");
        tableSchema!.findColumnByName("bigint")!.type.should.be.equal("bigint(20)");
        tableSchema!.findColumnByName("float")!.type.should.be.equal("float");
        tableSchema!.findColumnByName("double")!.type.should.be.equal("double");
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal(10,0)");
        tableSchema!.findColumnByName("date")!.type.should.be.equal("date");
        tableSchema!.findColumnByName("datetime")!.type.should.be.equal("datetime");
        tableSchema!.findColumnByName("timestamp")!.type.should.be.equal("timestamp");
        tableSchema!.findColumnByName("time")!.type.should.be.equal("time");
        tableSchema!.findColumnByName("year")!.type.should.be.equal("year(4)");
        tableSchema!.findColumnByName("char")!.type.should.be.equal("char(1)");
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("blob")!.type.should.be.equal("blob");
        tableSchema!.findColumnByName("text")!.type.should.be.equal("text");
        tableSchema!.findColumnByName("tinyblob")!.type.should.be.equal("tinyblob");
        tableSchema!.findColumnByName("tinytext")!.type.should.be.equal("tinytext");
        tableSchema!.findColumnByName("mediumblob")!.type.should.be.equal("mediumblob");
        tableSchema!.findColumnByName("mediumtext")!.type.should.be.equal("mediumtext");
        tableSchema!.findColumnByName("longblob")!.type.should.be.equal("longblob");
        tableSchema!.findColumnByName("longtext")!.type.should.be.equal("longtext");
        tableSchema!.findColumnByName("enum")!.type.should.be.equal("enum(\'a\',\'b\',\'c\')");
        tableSchema!.findColumnByName("simpleArray")!.type.should.be.equal("text");

    })));

    it("all types should work correctly - persist and hydrate when options are specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithOptions);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.loadTableSchema("post_with_options");
        await queryRunner.release();

        const post = new PostWithOptions();
        post.id = "1";
        post.name = "Post";
        post.int = 2147483647;
        post.tinyint = 127;
        post.smallint = 32767;
        post.mediumint = 8388607;
        post.bigint = 8223372036854775807;
        post.float = 10.53;
        post.double = 10.12;
        post.decimal = 50;
        post.char = "A";
        post.varchar = "This is varchar";
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOneById(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.int.should.be.equal(post.int);
        loadedPost.tinyint.should.be.equal(post.tinyint);
        loadedPost.smallint.should.be.equal(post.smallint);
        loadedPost.mediumint.should.be.equal(post.mediumint);
        loadedPost.bigint.should.be.equal(post.bigint);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.double.should.be.equal(post.double);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.char.should.be.equal(post.char);
        loadedPost.varchar.should.be.equal(post.varchar);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar(10)");
        tableSchema!.findColumnByName("int")!.type.should.be.equal("int(3)");
        tableSchema!.findColumnByName("tinyint")!.type.should.be.equal("tinyint(3)");
        tableSchema!.findColumnByName("smallint")!.type.should.be.equal("smallint(3)");
        tableSchema!.findColumnByName("mediumint")!.type.should.be.equal("mediumint(3)");
        tableSchema!.findColumnByName("bigint")!.type.should.be.equal("bigint(3)");
        tableSchema!.findColumnByName("float")!.type.should.be.equal("float(5,2)");
        tableSchema!.findColumnByName("double")!.type.should.be.equal("double(5,2)");
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal(5,2)");
        tableSchema!.findColumnByName("char")!.type.should.be.equal("char(5)");
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar(30)");

    })));

});
