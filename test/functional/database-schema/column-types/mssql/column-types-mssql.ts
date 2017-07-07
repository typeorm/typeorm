import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {PostWithOptions} from "./entity/PostWithOptions";

describe("database schema > column types > mssql", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchemaOnConnection: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it.skip("all types should work correctly - persist and hydrate", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.loadTableSchema("post");
        await queryRunner.release();

        const post = new Post();
        post.id = 1;
        post.name = "Post";
        post.bit = true;
        post.tinyint = 127;
        post.smallint = 32767;
        post.int = 2147483647;
        post.bigint = "9223372036854775807";
        post.decimal = 50;
        post.dec = 100;
        post.numeric = 10;
        post.float = 10.53;
        post.real = 10.5;
        post.smallmoney = 100;
        post.money = 2500;
        post.char = "A";
        // post.varchar = "This is varchar";
        // post.text = "This is text";
        // post.nchar = "This is nchar";
        // post.nvarchar = "This is nvarchar";
        // post.ntext = "This is ntext";
        // post.binary = new Buffer("This is blob");
        // post.varbinary = new Buffer("This is varbinary");
        // post.image = new Buffer("This is image");
        post.date = "2017-06-21";
        post.datetime = new Date();
        post.datetime.setMilliseconds(0);
        post.datetime2 = new Date();
        post.datetime2.setMilliseconds(0);
        post.smalldatetime = new Date();
        post.smalldatetime.setMilliseconds(0);
        post.time = new Date();
        post.time.setMilliseconds(0);
        post.datetimeoffset = new Date();
        post.datetimeoffset.setMilliseconds(0);
        post.simpleArray = ["A", "B", "C"];
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOneById(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.bit.should.be.equal(post.bit);
        loadedPost.smallint.should.be.equal(post.smallint);
        loadedPost.tinyint.should.be.equal(post.tinyint);
        loadedPost.int.should.be.equal(post.int);
        loadedPost.bigint.should.be.equal(post.bigint);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.dec.should.be.equal(post.dec);
        loadedPost.numeric.should.be.equal(post.numeric);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.real.should.be.equal(post.real);
        loadedPost.smallmoney.should.be.equal(post.smallmoney);
        loadedPost.money.should.be.equal(post.money);
        loadedPost.char.should.be.equal(post.char);
       /* loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.text.should.be.equal(post.text);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.ntext.should.be.equal(post.ntext);
        loadedPost.binary.toString().should.be.equal(post.binary.toString());
        loadedPost.varbinary.should.be.equal(post.varbinary);
        loadedPost.image.should.be.equal(post.image);*/
        loadedPost.date.should.be.equal(post.date);
        loadedPost.datetime.getTime().should.be.equal(post.datetime.getTime());
        loadedPost.datetime2.getTime().should.be.equal(post.datetime2.getTime());
        loadedPost.smalldatetime.getTime().should.be.equal(post.smalldatetime.getTime());
        loadedPost.time.getTime().should.be.equal(post.time.getTime());
        loadedPost.datetimeoffset.getTime().should.be.equal(post.datetimeoffset.getTime());
        loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
        loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
        loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);

        console.log(1);
        console.log(tableSchema);

        tableSchema!.findColumnByName("id")!.type.should.be.equal("integer");
        tableSchema!.findColumnByName("name")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("bit")!.type.should.be.equal("bit");
        tableSchema!.findColumnByName("tinyint")!.type.should.be.equal("tinyint");
        tableSchema!.findColumnByName("smallint")!.type.should.be.equal("smallint");
        tableSchema!.findColumnByName("mediumint")!.type.should.be.equal("mediumint");
        tableSchema!.findColumnByName("int")!.type.should.be.equal("int");
        tableSchema!.findColumnByName("bigint")!.type.should.be.equal("bigint");
        tableSchema!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        tableSchema!.findColumnByName("dec")!.type.should.be.equal("dec");
        tableSchema!.findColumnByName("numeric")!.type.should.be.equal("numeric");
        tableSchema!.findColumnByName("float")!.type.should.be.equal("float");
        tableSchema!.findColumnByName("real")!.type.should.be.equal("real");
        tableSchema!.findColumnByName("smallmoney")!.type.should.be.equal("smallmoney");
        tableSchema!.findColumnByName("money")!.type.should.be.equal("money");
        tableSchema!.findColumnByName("char")!.type.should.be.equal("char");
        tableSchema!.findColumnByName("varchar")!.type.should.be.equal("varchar(255)");
        tableSchema!.findColumnByName("text")!.type.should.be.equal("text");
        tableSchema!.findColumnByName("nchar")!.type.should.be.equal("nchar");
        tableSchema!.findColumnByName("nvarchar")!.type.should.be.equal("nvarchar");
        tableSchema!.findColumnByName("ntext")!.type.should.be.equal("ntext");
        tableSchema!.findColumnByName("binary")!.type.should.be.equal("binary");
        tableSchema!.findColumnByName("date")!.type.should.be.equal("date");
        tableSchema!.findColumnByName("datetime")!.type.should.be.equal("datetime");
        tableSchema!.findColumnByName("datetime2")!.type.should.be.equal("datetime2");
        tableSchema!.findColumnByName("smalldatetime")!.type.should.be.equal("smalldatetime");
        tableSchema!.findColumnByName("time")!.type.should.be.equal("time");
        tableSchema!.findColumnByName("datetimeoffset")!.type.should.be.equal("datetimeoffset");
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
