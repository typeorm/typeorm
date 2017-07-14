import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {PostWithOptions} from "./entity/PostWithOptions";
import {PostWithoutTypes} from "./entity/PostWithoutTypes";
import {FruitEnum} from "./enum/FruitEnum";

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
        post.id = 1;
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
        post.datetime.setMilliseconds(0); // set milliseconds to zero, because if datetime type specified without precision, milliseconds won't save in database
        post.timestamp = new Date();
        post.timestamp.setMilliseconds(0); // set milliseconds to zero, because if datetime type specified without precision, milliseconds won't save in database
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
        post.classEnum1 = FruitEnum.Apple;
        post.json = { id: 1, name: "Post" };
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
        loadedPost.classEnum1.should.be.equal(post.classEnum1);
        loadedPost.json.should.be.eql(post.json);
        loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
        loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
        loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("int");
        tableSchema!.findColumnByName("id")!.length!.should.be.equal(11);
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar");
        tableSchema!.findColumnByName("name")!.length!.should.be.equal(255);
        tableSchema!.findColumnByName("int")!.type.should.be.equal("int");
        tableSchema!.findColumnByName("int")!.length!.should.be.equal(11);
        tableSchema!.findColumnByName("tinyint")!.type.should.be.equal("tinyint");
        tableSchema!.findColumnByName("tinyint")!.length!.should.be.equal(4);
        tableSchema!.findColumnByName("smallint")!.type.should.be.equal("smallint");
        tableSchema!.findColumnByName("smallint")!.length!.should.be.equal(5);
        tableSchema!.findColumnByName("mediumint")!.type.should.be.equal("mediumint");
        tableSchema!.findColumnByName("mediumint")!.length!.should.be.equal(9);
        tableSchema!.findColumnByName("bigint")!.type.should.be.equal("bigint");
        tableSchema!.findColumnByName("bigint")!.length!.should.be.equal(20);
        tableSchema!.findColumnByName("float")!.type.should.be.equal("float");
        tableSchema!.findColumnByName("double")!.type.should.be.equal("double");
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        tableSchema!.findColumnByName("decimal")!.precision!.should.be.equal(10);
        tableSchema!.findColumnByName("decimal")!.scale!.should.be.equal(0);
        tableSchema!.findColumnByName("date")!.type.should.be.equal("date");
        tableSchema!.findColumnByName("datetime")!.type.should.be.equal("datetime");
        tableSchema!.findColumnByName("timestamp")!.type.should.be.equal("timestamp");
        tableSchema!.findColumnByName("time")!.type.should.be.equal("time");
        tableSchema!.findColumnByName("year")!.type.should.be.equal("year");
        tableSchema!.findColumnByName("year")!.length!.should.be.equal(4);
        tableSchema!.findColumnByName("char")!.type.should.be.equal("char");
        tableSchema!.findColumnByName("char")!.length!.should.be.equal(1);
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar");
        tableSchema!.findColumnByName("varchar")!.length!.should.be.equal(255);
        tableSchema!.findColumnByName("blob")!.type.should.be.equal("blob");
        tableSchema!.findColumnByName("text")!.type.should.be.equal("text");
        tableSchema!.findColumnByName("tinyblob")!.type.should.be.equal("tinyblob");
        tableSchema!.findColumnByName("tinytext")!.type.should.be.equal("tinytext");
        tableSchema!.findColumnByName("mediumblob")!.type.should.be.equal("mediumblob");
        tableSchema!.findColumnByName("mediumtext")!.type.should.be.equal("mediumtext");
        tableSchema!.findColumnByName("longblob")!.type.should.be.equal("longblob");
        tableSchema!.findColumnByName("longtext")!.type.should.be.equal("longtext");
        tableSchema!.findColumnByName("enum")!.type.should.be.equal("enum");
        tableSchema!.findColumnByName("enum")!.enum![0].should.be.equal("A");
        tableSchema!.findColumnByName("enum")!.enum![1].should.be.equal("B");
        tableSchema!.findColumnByName("enum")!.enum![2].should.be.equal("C");
        tableSchema!.findColumnByName("classEnum1")!.type.should.be.equal("enum");
        tableSchema!.findColumnByName("classEnum1")!.enum![0].should.be.equal("apple");
        tableSchema!.findColumnByName("classEnum1")!.enum![1].should.be.equal("pineapple");
        tableSchema!.findColumnByName("classEnum1")!.enum![2].should.be.equal("banana");
        tableSchema!.findColumnByName("json")!.type.should.be.equal("json");
        tableSchema!.findColumnByName("simpleArray")!.type.should.be.equal("text");

    })));

    it("all types should work correctly - persist and hydrate when options are specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithOptions);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.loadTableSchema("post_with_options");
        await queryRunner.release();

        const post = new PostWithOptions();
        post.id = 1;
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
        post.datetime = new Date();
        post.timestamp = new Date();
        post.time = "15:30:00.256";
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
        loadedPost.datetime.getTime().should.be.equal(post.datetime.getTime());
        loadedPost.timestamp.getTime().should.be.equal(post.timestamp.getTime());
        loadedPost.time.should.be.equal(post.time);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("int");
        tableSchema!.findColumnByName("id")!.length!.should.be.equal(11);
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar");
        tableSchema!.findColumnByName("name")!.length!.should.be.equal(10);
        tableSchema!.findColumnByName("int")!.type.should.be.equal("int");
        tableSchema!.findColumnByName("int")!.length!.should.be.equal(3);
        tableSchema!.findColumnByName("tinyint")!.type.should.be.equal("tinyint");
        tableSchema!.findColumnByName("tinyint")!.length!.should.be.equal(3);
        tableSchema!.findColumnByName("smallint")!.type.should.be.equal("smallint");
        tableSchema!.findColumnByName("smallint")!.length!.should.be.equal(3);
        tableSchema!.findColumnByName("mediumint")!.type.should.be.equal("mediumint");
        tableSchema!.findColumnByName("mediumint")!.length!.should.be.equal(3);
        tableSchema!.findColumnByName("bigint")!.type.should.be.equal("bigint");
        tableSchema!.findColumnByName("bigint")!.length!.should.be.equal(3);
        tableSchema!.findColumnByName("float")!.type.should.be.equal("float");
        tableSchema!.findColumnByName("float")!.precision!.should.be.equal(5);
        tableSchema!.findColumnByName("float")!.scale!.should.be.equal(2);
        tableSchema!.findColumnByName("double")!.type.should.be.equal("double");
        tableSchema!.findColumnByName("double")!.precision!.should.be.equal(5);
        tableSchema!.findColumnByName("double")!.scale!.should.be.equal(2);
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        tableSchema!.findColumnByName("decimal")!.precision!.should.be.equal(5);
        tableSchema!.findColumnByName("decimal")!.scale!.should.be.equal(2);
        tableSchema!.findColumnByName("char")!.type.should.be.equal("char");
        tableSchema!.findColumnByName("char")!.length!.should.be.equal(5);
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar");
        tableSchema!.findColumnByName("varchar")!.length!.should.be.equal(30);
        tableSchema!.findColumnByName("datetime")!.type.should.be.equal("datetime");
        tableSchema!.findColumnByName("datetime")!.precision!.should.be.equal(6);
        tableSchema!.findColumnByName("timestamp")!.type.should.be.equal("timestamp");
        tableSchema!.findColumnByName("timestamp")!.precision!.should.be.equal(6);
        tableSchema!.findColumnByName("time")!.type.should.be.equal("time");
        tableSchema!.findColumnByName("time")!.precision!.should.be.equal(3);

    })));

    it("all types should work correctly - persist and hydrate when types are not specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithoutTypes);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.loadTableSchema("post_without_types");
        await queryRunner.release();

        const post = new PostWithoutTypes();
        post.id = 1;
        post.name = "Post";
        post.boolean = true;
        post.blob = new Buffer("A");
        post.datetime = new Date();
        post.datetime.setMilliseconds(0); // set milliseconds to zero, because if datetime type specified without precision, milliseconds won't save in database
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOneById(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.boolean.should.be.equal(post.boolean);
        loadedPost.blob.toString().should.be.equal(post.blob.toString());
        loadedPost.datetime.getTime().should.be.equal(post.datetime.getTime());

        tableSchema!.findColumnByName("id")!.type.should.be.equal("int");
        tableSchema!.findColumnByName("id")!.length!.should.be.equal(11);
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar");
        tableSchema!.findColumnByName("name")!.length!.should.be.equal(255);
        tableSchema!.findColumnByName("boolean")!.type.should.be.equal("tinyint");
        tableSchema!.findColumnByName("boolean")!.length!.should.be.equal(4);
        tableSchema!.findColumnByName("blob")!.type.should.be.equal("blob");
        tableSchema!.findColumnByName("datetime")!.type.should.be.equal("datetime");

    })));

});
