import "reflect-metadata"
import { Post } from "./entity/Post"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { PostWithOptions } from "./entity/PostWithOptions"
import { PostWithoutTypes } from "./entity/PostWithoutTypes"
import { FruitEnum } from "./enum/FruitEnum"

describe("database schema > column types > mysql", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("all types should work correctly - persist and hydrate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const post = new Post()
                post.id = 1
                post.bit = Buffer.from([0])
                post.int = 2147483647
                post.integer = 2147483647
                post.tinyint = 127
                post.smallint = 32767
                post.mediumint = 8388607
                post.bigint = "8223372036854775807"
                post.float = 10.53
                post.double = 10.1234
                post.doublePrecision = 10.1234
                post.real = 10.1234
                post.dec = "822337"
                post.decimal = "822337"
                post.numeric = "822337"
                post.fixed = "822337"
                post.bool = true
                post.boolean = false
                post.char = "A"
                post.nChar = "A"
                post.nationalChar = "A"
                post.varchar = "This is varchar"
                post.nVarchar = "This is varchar"
                post.nationalVarchar = "This is varchar"
                post.text = "This is text"
                post.tinytext = "This is tinytext"
                post.mediumtext = "This is mediumtext"
                post.longtext = "This is longtext"
                post.date = "2017-06-21"
                post.datetime = new Date()
                post.datetime.setMilliseconds(0) // set milliseconds to zero, because if datetime type specified without precision, milliseconds won't save in database
                post.timestamp = new Date()
                post.timestamp.setMilliseconds(0) // set milliseconds to zero, because if datetime type specified without precision, milliseconds won't save in database
                post.time = "15:30:00"
                post.year = 2017
                post.binary = Buffer.from("A")
                post.varbinary = Buffer.from("B")
                post.blob = Buffer.from("This is blob")
                post.tinyblob = Buffer.from("This is tinyblob")
                post.mediumblob = Buffer.from("This is mediumblob")
                post.longblob = Buffer.from("This is longblob")
                post.geometry = "POINT(1 1)"
                post.point = "POINT(1 1)"
                post.linestring = "LINESTRING(0 0,1 1,2 2)"
                post.polygon =
                    "POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7,5 5))"
                post.multipoint = "MULTIPOINT((0 0),(20 20),(60 60))"
                post.multilinestring =
                    "MULTILINESTRING((10 10,20 20),(15 15,30 15))"
                post.multipolygon =
                    "MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0)),((5 5,7 5,7 7,5 7,5 5)))"
                post.geometrycollection =
                    "GEOMETRYCOLLECTION(POINT(10 10),POINT(30 30),LINESTRING(15 15,20 20))"
                post.enum = "A"
                post.classEnum1 = FruitEnum.Apple
                post.json = { id: 1, name: "Post" }
                post.simpleArray = ["A", "B", "C"]
                post.simpleJson = { param: "VALUE" }
                post.simpleEnum = "A"
                post.simpleClassEnum1 = FruitEnum.Apple
                await postRepository.save(post)

                const loadedPost = (await postRepository.findOneBy({
                    id: 1,
                }))!
                loadedPost.id.should.be.equal(post.id)
                loadedPost.bit.toString().should.be.equal(post.bit.toString())
                loadedPost.int.should.be.equal(post.int)
                loadedPost.tinyint.should.be.equal(post.tinyint)
                loadedPost.smallint.should.be.equal(post.smallint)
                loadedPost.mediumint.should.be.equal(post.mediumint)
                loadedPost.bigint.should.be.equal(post.bigint)
                loadedPost.float.should.be.equal(post.float)
                loadedPost.double.should.be.equal(post.double)
                loadedPost.doublePrecision.should.be.equal(post.doublePrecision)
                loadedPost.real.should.be.equal(post.real)
                loadedPost.dec.should.be.equal(post.dec)
                loadedPost.decimal.should.be.equal(post.decimal)
                loadedPost.numeric.should.be.equal(post.numeric)
                loadedPost.fixed.should.be.equal(post.fixed)
                loadedPost.bool.should.be.equal(post.bool)
                loadedPost.boolean.should.be.equal(post.boolean)
                loadedPost.char.should.be.equal(post.char)
                loadedPost.nChar.should.be.equal(post.nChar)
                loadedPost.nationalChar.should.be.equal(post.nationalChar)
                loadedPost.varchar.should.be.equal(post.varchar)
                loadedPost.nVarchar.should.be.equal(post.nVarchar)
                loadedPost.nationalVarchar.should.be.equal(post.nationalVarchar)
                loadedPost.text.should.be.equal(post.text)
                loadedPost.tinytext.should.be.equal(post.tinytext)
                loadedPost.mediumtext.should.be.equal(post.mediumtext)
                loadedPost.longtext.should.be.equal(post.longtext)
                loadedPost.date.should.be.equal(post.date)
                loadedPost.datetime
                    .getTime()
                    .should.be.equal(post.datetime.getTime())
                loadedPost.timestamp
                    .getTime()
                    .should.be.equal(post.timestamp.getTime())
                loadedPost.time.should.be.equal(post.time)
                loadedPost.year.should.be.equal(post.year)
                loadedPost.binary
                    .toString()
                    .should.be.equal(post.binary.toString())
                loadedPost.varbinary
                    .toString()
                    .should.be.equal(post.varbinary.toString())
                loadedPost.blob.toString().should.be.equal(post.blob.toString())
                loadedPost.tinyblob
                    .toString()
                    .should.be.equal(post.tinyblob.toString())
                loadedPost.mediumblob
                    .toString()
                    .should.be.equal(post.mediumblob.toString())
                loadedPost.longblob
                    .toString()
                    .should.be.equal(post.longblob.toString())
                loadedPost.geometry.should.be.equal(post.geometry)
                loadedPost.point.should.be.equal(post.point)
                loadedPost.linestring.should.be.equal(post.linestring)
                loadedPost.polygon.should.be.equal(post.polygon)
                loadedPost.multipoint.should.be.equal(post.multipoint)
                loadedPost.multilinestring.should.be.equal(post.multilinestring)
                loadedPost.multipolygon.should.be.equal(post.multipolygon)
                loadedPost.geometrycollection.should.be.equal(
                    post.geometrycollection,
                )
                loadedPost.enum.should.be.equal(post.enum)
                loadedPost.classEnum1.should.be.equal(post.classEnum1)
                loadedPost.json.should.be.eql(post.json)
                loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0])
                loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1])
                loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2])
                loadedPost.simpleJson.param.should.be.equal(
                    post.simpleJson.param,
                )
                loadedPost.simpleEnum.should.be.equal(post.simpleEnum)
                loadedPost.simpleClassEnum1.should.be.equal(
                    post.simpleClassEnum1,
                )

                table!.findColumnByName("id")!.type.should.be.equal("int")
                table!.findColumnByName("bit")!.type.should.be.equal("bit")
                table!.findColumnByName("int")!.type.should.be.equal("int")
                table!.findColumnByName("integer")!.type.should.be.equal("int")
                table!
                    .findColumnByName("tinyint")!
                    .type.should.be.equal("tinyint")
                table!
                    .findColumnByName("smallint")!
                    .type.should.be.equal("smallint")
                table!
                    .findColumnByName("mediumint")!
                    .type.should.be.equal("mediumint")
                table!
                    .findColumnByName("bigint")!
                    .type.should.be.equal("bigint")
                table!.findColumnByName("float")!.type.should.be.equal("float")
                table!
                    .findColumnByName("double")!
                    .type.should.be.equal("double")
                table!
                    .findColumnByName("doublePrecision")!
                    .type.should.be.equal("double")
                table!.findColumnByName("real")!.type.should.be.equal("double")
                table!.findColumnByName("dec")!.type.should.be.equal("decimal")
                table!
                    .findColumnByName("decimal")!
                    .type.should.be.equal("decimal")
                table!
                    .findColumnByName("numeric")!
                    .type.should.be.equal("decimal")
                table!
                    .findColumnByName("fixed")!
                    .type.should.be.equal("decimal")
                table!.findColumnByName("bool")!.type.should.be.equal("tinyint")
                table!
                    .findColumnByName("boolean")!
                    .type.should.be.equal("tinyint")
                table!.findColumnByName("char")!.type.should.be.equal("char")
                table!.findColumnByName("nChar")!.type.should.be.equal("char")
                table!
                    .findColumnByName("nationalChar")!
                    .type.should.be.equal("char")
                table!
                    .findColumnByName("varchar")!
                    .type.should.be.equal("varchar")
                table!
                    .findColumnByName("nVarchar")!
                    .type.should.be.equal("varchar")
                table!
                    .findColumnByName("nationalVarchar")!
                    .type.should.be.equal("varchar")
                table!.findColumnByName("text")!.type.should.be.equal("text")
                table!
                    .findColumnByName("tinytext")!
                    .type.should.be.equal("tinytext")
                table!
                    .findColumnByName("mediumtext")!
                    .type.should.be.equal("mediumtext")
                table!
                    .findColumnByName("longtext")!
                    .type.should.be.equal("longtext")
                table!.findColumnByName("date")!.type.should.be.equal("date")
                table!
                    .findColumnByName("datetime")!
                    .type.should.be.equal("datetime")
                table!
                    .findColumnByName("timestamp")!
                    .type.should.be.equal("timestamp")
                table!.findColumnByName("time")!.type.should.be.equal("time")
                table!.findColumnByName("year")!.type.should.be.equal("year")
                table!
                    .findColumnByName("binary")!
                    .type.should.be.equal("binary")
                table!
                    .findColumnByName("varbinary")!
                    .type.should.be.equal("varbinary")
                table!.findColumnByName("blob")!.type.should.be.equal("blob")
                table!
                    .findColumnByName("tinyblob")!
                    .type.should.be.equal("tinyblob")
                table!
                    .findColumnByName("mediumblob")!
                    .type.should.be.equal("mediumblob")
                table!
                    .findColumnByName("longblob")!
                    .type.should.be.equal("longblob")
                table!
                    .findColumnByName("geometry")!
                    .type.should.be.equal("geometry")
                table!.findColumnByName("point")!.type.should.be.equal("point")
                table!
                    .findColumnByName("linestring")!
                    .type.should.be.equal("linestring")
                table!
                    .findColumnByName("polygon")!
                    .type.should.be.equal("polygon")
                table!
                    .findColumnByName("multipoint")!
                    .type.should.be.equal("multipoint")
                table!
                    .findColumnByName("multilinestring")!
                    .type.should.be.equal("multilinestring")
                table!
                    .findColumnByName("multipolygon")!
                    .type.should.be.equal("multipolygon")
                table!
                    .findColumnByName("geometrycollection")!
                    .type.should.be.equal("geometrycollection")
                table!.findColumnByName("enum")!.type.should.be.equal("enum")
                table!.findColumnByName("enum")!.enum![0].should.be.equal("A")
                table!.findColumnByName("enum")!.enum![1].should.be.equal("B")
                table!.findColumnByName("enum")!.enum![2].should.be.equal("C")
                table!
                    .findColumnByName("classEnum1")!
                    .type.should.be.equal("enum")
                table!
                    .findColumnByName("classEnum1")!
                    .enum![0].should.be.equal("apple")
                table!
                    .findColumnByName("classEnum1")!
                    .enum![1].should.be.equal("pineapple")
                table!
                    .findColumnByName("classEnum1")!
                    .enum![2].should.be.equal("banana")
                table!.findColumnByName("json")!.type.should.be.equal("json")
                table!
                    .findColumnByName("simpleArray")!
                    .type.should.be.equal("text")
                table!
                    .findColumnByName("simpleJson")!
                    .type.should.be.equal("text")
                table!
                    .findColumnByName("simpleEnum")!
                    .type.should.be.equal("enum")
                table!
                    .findColumnByName("simpleEnum")!
                    .enum![0].should.be.equal("A")
                table!
                    .findColumnByName("simpleEnum")!
                    .enum![1].should.be.equal("B")
                table!
                    .findColumnByName("simpleEnum")!
                    .enum![2].should.be.equal("C")
                table!
                    .findColumnByName("simpleClassEnum1")!
                    .type.should.be.equal("enum")
                table!
                    .findColumnByName("simpleClassEnum1")!
                    .enum![0].should.be.equal("apple")
                table!
                    .findColumnByName("simpleClassEnum1")!
                    .enum![1].should.be.equal("pineapple")
                table!
                    .findColumnByName("simpleClassEnum1")!
                    .enum![2].should.be.equal("banana")
            }),
        ))

    it("all types should work correctly - persist and hydrate when options are specified on columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(PostWithOptions)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post_with_options")
                await queryRunner.release()

                const post = new PostWithOptions()
                post.id = 1
                post.name = "Post"
                post.float = 10.53
                post.double = 10.12
                post.decimal = "12345.00"
                post.char = "A"
                post.varchar = "This is varchar"
                post.datetime = new Date()
                post.timestamp = new Date()
                post.time = "15:30:00.256"
                await postRepository.save(post)

                const loadedPost = (await postRepository.findOneBy({
                    id: 1,
                }))!
                loadedPost.id.should.be.equal(post.id)
                loadedPost.name.should.be.equal(post.name)
                loadedPost.float.should.be.equal(post.float)
                loadedPost.double.should.be.equal(post.double)
                loadedPost.decimal.should.be.equal(post.decimal)
                loadedPost.char.should.be.equal(post.char)
                loadedPost.varchar.should.be.equal(post.varchar)
                loadedPost.datetime
                    .getTime()
                    .should.be.equal(post.datetime.getTime())
                loadedPost.timestamp
                    .getTime()
                    .should.be.equal(post.timestamp.getTime())
                loadedPost.time.should.be.equal(post.time)

                table!.findColumnByName("id")!.type.should.be.equal("int")
                table!.findColumnByName("name")!.type.should.be.equal("varchar")
                table!.findColumnByName("name")!.length!.should.be.equal("10")
                table!.findColumnByName("float")!.type.should.be.equal("float")
                table!.findColumnByName("float")!.precision!.should.be.equal(5)
                table!.findColumnByName("float")!.scale!.should.be.equal(2)
                table!
                    .findColumnByName("double")!
                    .type.should.be.equal("double")
                table!.findColumnByName("double")!.precision!.should.be.equal(5)
                table!.findColumnByName("double")!.scale!.should.be.equal(2)
                table!
                    .findColumnByName("decimal")!
                    .type.should.be.equal("decimal")
                table!
                    .findColumnByName("decimal")!
                    .precision!.should.be.equal(7)
                table!.findColumnByName("decimal")!.scale!.should.be.equal(2)
                table!.findColumnByName("char")!.type.should.be.equal("char")
                table!.findColumnByName("char")!.length!.should.be.equal("5")
                table!
                    .findColumnByName("varchar")!
                    .type.should.be.equal("varchar")
                table!
                    .findColumnByName("varchar")!
                    .length!.should.be.equal("30")
                table!
                    .findColumnByName("datetime")!
                    .type.should.be.equal("datetime")
                table!
                    .findColumnByName("datetime")!
                    .precision!.should.be.equal(6)
                table!
                    .findColumnByName("timestamp")!
                    .type.should.be.equal("timestamp")
                table!
                    .findColumnByName("timestamp")!
                    .precision!.should.be.equal(6)
                table!.findColumnByName("time")!.type.should.be.equal("time")
                table!.findColumnByName("time")!.precision!.should.be.equal(3)
            }),
        ))

    it("all types should work correctly - persist and hydrate when types are not specified on columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository =
                    connection.getRepository(PostWithoutTypes)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post_without_types")
                await queryRunner.release()

                const post = new PostWithoutTypes()
                post.id = 1
                post.name = "Post"
                post.boolean = true
                post.blob = Buffer.from("A")
                post.datetime = new Date()
                post.datetime.setMilliseconds(0) // set milliseconds to zero, because if datetime type specified without precision, milliseconds won't save in database
                await postRepository.save(post)

                const loadedPost = (await postRepository.findOneBy({
                    id: 1,
                }))!
                loadedPost.id.should.be.equal(post.id)
                loadedPost.name.should.be.equal(post.name)
                loadedPost.boolean.should.be.equal(post.boolean)
                loadedPost.blob.toString().should.be.equal(post.blob.toString())
                loadedPost.datetime
                    .getTime()
                    .should.be.equal(post.datetime.getTime())

                table!.findColumnByName("id")!.type.should.be.equal("int")
                table!.findColumnByName("name")!.type.should.be.equal("varchar")
                table!
                    .findColumnByName("boolean")!
                    .type.should.be.equal("tinyint")
                table!.findColumnByName("blob")!.type.should.be.equal("blob")
                table!
                    .findColumnByName("datetime")!
                    .type.should.be.equal("datetime")
            }),
        ))
})
