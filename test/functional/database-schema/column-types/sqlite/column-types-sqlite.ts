import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {PostWithOptions} from "./entity/PostWithOptions";

describe("database schema > column types > sqlite", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sqlite"],
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
        post.integer = 2147483647;
        post.int = 2147483647;
        post.int2 = 32767;
        post.int8 = 8223372036854775807;
        post.tinyint = 127;
        post.smallint = 32767;
        post.mediumint = 8388607;
        post.bigint = 8223372036854775807;
        post.unsignedBigInt = 8223372036854775807;
        post.character = "A";
        post.varchar = "This is varchar";
        post.varyingCharacter = "This is varying character";
        post.nchar = "This is nchar";
        post.nativeCharacter = "This is native character";
        post.nvarchar = "This is nvarchar";
        post.blob = new Buffer("This is blob");
        post.clob = "This is clob";
        post.text = "This is text";
        post.real = 10.5;
        post.double = 10.1234;
        post.doublePrecision = 10.1234;
        post.float = 10.53;
        post.numeric = 10;
        post.decimal = 50;
        post.boolean = true;
        post.date = "2017-06-21";
        post.datetime = new Date();
        post.datetime.setMilliseconds(0);
        post.simpleArray = ["A", "B", "C"];
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOneById(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.int.should.be.equal(post.int);
        loadedPost.int2.should.be.equal(post.int2);
        loadedPost.int8.should.be.equal(post.int8);
        loadedPost.tinyint.should.be.equal(post.tinyint);
        loadedPost.smallint.should.be.equal(post.smallint);
        loadedPost.mediumint.should.be.equal(post.mediumint);
        loadedPost.bigint.should.be.equal(post.bigint);
        loadedPost.unsignedBigInt.should.be.equal(post.unsignedBigInt);
        loadedPost.character.should.be.equal(post.character);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.varyingCharacter.should.be.equal(post.varyingCharacter);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.nativeCharacter.should.be.equal(post.nativeCharacter);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.text.should.be.equal(post.text);
        loadedPost.blob.toString().should.be.equal(post.blob.toString());
        loadedPost.clob.should.be.equal(post.clob);
        loadedPost.real.should.be.equal(post.real);
        loadedPost.double.should.be.equal(post.double);
        loadedPost.doublePrecision.should.be.equal(post.doublePrecision);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.numeric.should.be.equal(post.numeric);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.date.should.be.equal(post.date);
        loadedPost.boolean.should.be.equal(post.boolean);
        loadedPost.date.should.be.equal(post.date);
        loadedPost.datetime.getTime().should.be.equal(post.datetime.getTime());
        loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
        loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
        loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("integer");
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("int")!.type.should.be.equal("integer");
        tableSchema!.findColumnByName("int2")!.type.should.be.equal("int2");
        tableSchema!.findColumnByName("int8")!.type.should.be.equal("int8");
        tableSchema!.findColumnByName("tinyint")!.type.should.be.equal("tinyint");
        tableSchema!.findColumnByName("smallint")!.type.should.be.equal("smallint");
        tableSchema!.findColumnByName("mediumint")!.type.should.be.equal("mediumint");
        tableSchema!.findColumnByName("bigint")!.type.should.be.equal("bigint");
        tableSchema!.findColumnByName("unsignedBigInt")!.type.should.be.equal("unsigned big int");
        tableSchema!.findColumnByName("character")!.type.should.be.equal("character");
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("varyingCharacter")!.type.should.be.equal("varying character");
        tableSchema!.findColumnByName("nchar")!.type.should.be.equal("nchar");
        tableSchema!.findColumnByName("nativeCharacter")!.type.should.be.equal("native character");
        tableSchema!.findColumnByName("nvarchar")!.type.should.be.equal("nvarchar");
        tableSchema!.findColumnByName("text")!.type.should.be.equal("text");
        tableSchema!.findColumnByName("blob")!.type.should.be.equal("blob");
        tableSchema!.findColumnByName("clob")!.type.should.be.equal("clob");
        tableSchema!.findColumnByName("real")!.type.should.be.equal("real");
        tableSchema!.findColumnByName("double")!.type.should.be.equal("double");
        tableSchema!.findColumnByName("doublePrecision")!.type.should.be.equal("double precision");
        tableSchema!.findColumnByName("float")!.type.should.be.equal("float");
        tableSchema!.findColumnByName("numeric")!.type.should.be.equal("numeric");
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        tableSchema!.findColumnByName("boolean")!.type.should.be.equal("boolean");
        tableSchema!.findColumnByName("date")!.type.should.be.equal("date");
        tableSchema!.findColumnByName("datetime")!.type.should.be.equal("datetime");
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
        post.character = "A";
        post.varchar = "This is varchar";
        post.varyingCharacter = "This is varying character";
        post.nchar = "This is nchar";
        post.nativeCharacter = "This is native character";
        post.nvarchar = "This is nvarchar";
        post.decimal = 50;
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOneById(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.character.should.be.equal(post.character);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.varyingCharacter.should.be.equal(post.varyingCharacter);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.nativeCharacter.should.be.equal(post.nativeCharacter);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.decimal.should.be.equal(post.decimal);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("integer");
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("character")!.type.should.be.equal("character(20)");
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("varyingCharacter")!.type.should.be.equal("varying character(255)");
        tableSchema!.findColumnByName("nchar")!.type.should.be.equal("nchar(55)");
        tableSchema!.findColumnByName("nativeCharacter")!.type.should.be.equal("native character(70)");
        tableSchema!.findColumnByName("nvarchar")!.type.should.be.equal("nvarchar(100)");
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal(10,5)");

    })));

});
