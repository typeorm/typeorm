import "reflect-metadata"

import { expect } from "chai"
import { DataSource, DeepPartial } from "../../../../../src"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostWithOptions } from "./entity/PostWithOptions"
import { PostWithoutTypes } from "./entity/PostWithoutTypes"
import { Embedding } from "./entity/Embedding"

describe("database schema > column types > sap", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sap"],
            driverSpecific: {
                extra: {
                    vectorOutputType: "Array",
                },
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("all types should work correctly - persist and hydrate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const plainPost = {
                    id: 1,
                    name: "Post",
                    int: 2147483647,
                    integer: 2147483647,
                    tinyint: 250,
                    smallint: 32767,
                    bigint: "8223372036854775807",
                    decimal: "8223372036854775807",
                    dec: "8223372036854775807",
                    smalldecimal: "8223372036854775",
                    real: 10.5,
                    double: 10.53,
                    float: 10.53,
                    char: "A",
                    nchar: "A",
                    varchar: "This is varchar",
                    nvarchar: "This is nvarchar",
                    alphanum: "This is alphanum",
                    text: "This is text",
                    shorttext: "This is shorttext",
                    date: "2017-06-21",
                    time: "13:27:05",
                    timestamp: new Date(),
                    seconddate: (() => {
                        const d = new Date()
                        d.setMilliseconds(0)
                        return d
                    })(),
                    blob: Buffer.from("This is blob"),
                    clob: "This is clob",
                    nclob: "This is nclob",
                    boolean: true,
                    // array: ["A", "B", "C"]; // TODO
                    varbinary: Buffer.from("This is varbinary"),
                    simpleArray: ["A", "B", "C"],
                } satisfies DeepPartial<Post>

                const postRepository = dataSource.getRepository(Post)
                const post = postRepository.create(plainPost)
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    id: 1,
                })
                expect(loadedPost).to.deep.equal({
                    ...plainPost,
                })

                const queryRunner = dataSource.createQueryRunner()
                const table = (await queryRunner.getTable("post"))!
                await queryRunner.release()
                expect(table.findColumnByName("id")!.type).to.equal("integer")
                expect(table.findColumnByName("name")!.type).to.equal(
                    "nvarchar",
                )
                expect(table.findColumnByName("int")!.type).to.equal("integer")
                expect(table.findColumnByName("integer")!.type).to.equal(
                    "integer",
                )
                expect(table.findColumnByName("tinyint")!.type).to.equal(
                    "tinyint",
                )
                expect(table.findColumnByName("smallint")!.type).to.equal(
                    "smallint",
                )
                expect(table.findColumnByName("bigint")!.type).to.equal(
                    "bigint",
                )
                expect(table.findColumnByName("decimal")!.type).to.equal(
                    "decimal",
                )
                expect(table.findColumnByName("dec")!.type).to.equal("decimal")
                expect(table.findColumnByName("real")!.type).to.equal("real")
                expect(table.findColumnByName("double")!.type).to.equal(
                    "double",
                )
                expect(table.findColumnByName("float")!.type).to.equal("double")
                expect(table.findColumnByName("nchar")!.type).to.equal("nchar")
                expect(table.findColumnByName("nvarchar")!.type).to.equal(
                    "nvarchar",
                )
                expect(table.findColumnByName("date")!.type).to.equal("date")
                expect(table.findColumnByName("time")!.type).to.equal("time")
                expect(table.findColumnByName("timestamp")!.type).to.equal(
                    "timestamp",
                )
                expect(table.findColumnByName("seconddate")!.type).to.equal(
                    "seconddate",
                )
                expect(table.findColumnByName("blob")!.type).to.equal("blob")
                expect(table.findColumnByName("nclob")!.type).to.equal("nclob")
                expect(table.findColumnByName("boolean")!.type).to.equal(
                    "boolean",
                )
                expect(table.findColumnByName("varbinary")!.type).to.equal(
                    "varbinary",
                )
                expect(table.findColumnByName("simpleArray")!.type).to.equal(
                    "nclob",
                )

                // Deprecated column types that have a different behavior in SAP HANA Cloud
                if (
                    DriverUtils.isReleaseVersionOrGreater(
                        dataSource.driver,
                        "4.0",
                    )
                ) {
                    expect(table.findColumnByName("char")!.type).to.equal(
                        "nchar",
                    )
                    expect(table.findColumnByName("varchar")!.type).to.equal(
                        "nvarchar",
                    )
                    expect(table.findColumnByName("alphanum")!.type).to.equal(
                        "nvarchar",
                    )
                    expect(table.findColumnByName("shorttext")!.type).to.equal(
                        "nvarchar",
                    )
                    expect(table.findColumnByName("text")!.type).to.equal(
                        "nclob",
                    )
                    expect(table.findColumnByName("clob")!.type).to.equal(
                        "nclob",
                    )
                } else {
                    expect(table.findColumnByName("char")!.type).to.equal(
                        "char",
                    )
                    expect(table.findColumnByName("varchar")!.type).to.equal(
                        "varchar",
                    )
                    expect(table.findColumnByName("alphanum")!.type).to.equal(
                        "alphanum",
                    )
                    expect(table.findColumnByName("shorttext")!.type).to.equal(
                        "shorttext",
                    )
                    expect(table.findColumnByName("text")!.type).to.equal(
                        "text",
                    )
                    expect(table.findColumnByName("clob")!.type).to.equal(
                        "clob",
                    )
                }
            }),
        ))

    it("all types should work correctly - persist and hydrate when options are specified on columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const plainPost = {
                    id: 1,
                    dec: "60.00",
                    decimal: "70.000",
                    varchar: "This is varchar",
                    nvarchar: "This is nvarchar",
                    alphanum: "This is alphanum",
                    shorttext: "This is shorttext",
                } satisfies DeepPartial<PostWithOptions>

                const postRepository = dataSource.getRepository(PostWithOptions)
                const post = postRepository.create(plainPost)
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    id: 1,
                })
                expect(loadedPost).to.deep.equal(plainPost)

                const queryRunner = dataSource.createQueryRunner()
                const table = (await queryRunner.getTable("post_with_options"))!
                await queryRunner.release()
                expect(table.findColumnByName("id")!.type).to.equal("integer")
                expect(table.findColumnByName("dec")).to.include({
                    type: "decimal",
                    precision: 10,
                    scale: 2,
                })
                expect(table.findColumnByName("decimal")).to.include({
                    type: "decimal",
                    precision: 10,
                    scale: 3,
                })
                expect(table.findColumnByName("nvarchar")).to.include({
                    type: "nvarchar",
                    length: "50",
                })

                // Deprecated column types that have a different behavior in SAP HANA Cloud
                if (
                    DriverUtils.isReleaseVersionOrGreater(
                        dataSource.driver,
                        "4.0",
                    )
                ) {
                    expect(table.findColumnByName("varchar")).to.include({
                        type: "nvarchar",
                        length: "50",
                    })
                    expect(table.findColumnByName("alphanum")).to.include({
                        type: "nvarchar",
                        length: "50",
                    })
                    expect(table.findColumnByName("shorttext")).to.include({
                        type: "nvarchar",
                        length: "50",
                    })
                } else {
                    expect(table.findColumnByName("varchar")).to.include({
                        type: "varchar",
                        length: "50",
                    })
                    expect(table.findColumnByName("alphanum")).to.include({
                        type: "alphanum",
                        length: "50",
                    })
                    expect(table.findColumnByName("shorttext")).to.include({
                        type: "shorttext",
                        length: "50",
                    })
                }
            }),
        ))

    it("all types should work correctly - persist and hydrate when types are not specified on columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const plainPost = {
                    id: 1,
                    name: "Post",
                    boolean: true,
                    blob: Buffer.from("This is blob"),
                    timestamp: new Date(),
                } satisfies DeepPartial<PostWithoutTypes>

                const postRepository =
                    dataSource.getRepository(PostWithoutTypes)
                const post = postRepository.create(plainPost)
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    id: 1,
                })
                expect(loadedPost).to.deep.equal(plainPost)

                const queryRunner = dataSource.createQueryRunner()
                const table = (await queryRunner.getTable(
                    "post_without_types",
                ))!
                await queryRunner.release()
                expect(table.findColumnByName("id")!.type).to.equal("integer")
                expect(table.findColumnByName("name")!.type).to.equal(
                    "nvarchar",
                )
                expect(table.findColumnByName("boolean")!.type).to.equal(
                    "boolean",
                )
                expect(table.findColumnByName("blob")!.type).to.equal("blob")
                expect(table.findColumnByName("timestamp")!.type).to.equal(
                    "timestamp",
                )
            }),
        ))

    it("real_vector should work correctly - persist and hydrate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    !DriverUtils.isReleaseVersionOrGreater(
                        dataSource.driver,
                        "4.0",
                    )
                ) {
                    return
                }

                const plainEmbedding = {
                    id: 1,
                    content:
                        "This is a sample text to be analyzed by SAP Joule AI",
                    metadata: `{"client":"typeorm"}`,
                    smallVector: [
                        0.004318627528846264, -0.008295782841742039,
                        0.011462775990366936, -0.03171011060476303,
                        -0.003404685528948903, 0.018827877938747406,
                        0.010692788287997246, 0.014154385775327682,
                        -0.026206370443105698, -0.03977154940366745,
                        -0.008630559779703617, 0.040039367973804474,
                        0.0019048830727115273, 0.01347813569009304,
                        -0.02147931419312954, -0.004211498890072107,
                    ],
                    largeVector: null,
                    variableVector: [
                        -0.0015692687593400478, -0.013364311307668686,
                        0.013545091263949871, 0.034843627363443375,
                        0.02682236023247242, -0.011710511520504951,
                        0.0019400346791371703, -0.003324338933452964,
                        0.004094745498150587, -0.01127530075609684,
                        -0.020943669602274895, -0.018211888149380684,
                        -0.00585190812125802, 0.01311657577753067,
                        -0.011121302843093872, 0.003078277688473463,
                    ],
                } satisfies DeepPartial<Embedding>

                const embeddingRepository = dataSource.getRepository(Embedding)
                const embedding = embeddingRepository.create(plainEmbedding)
                await embeddingRepository.save(embedding)

                const loadedEmbedding = await embeddingRepository.findOneBy({
                    id: 1,
                })
                expect(loadedEmbedding).to.deep.equal(plainEmbedding)

                // Verify column metadata
                const queryRunner = dataSource.createQueryRunner()
                const table = (await queryRunner.getTable("embedding"))!
                await queryRunner.release()

                expect(table.findColumnByName("smallVector")).to.contain({
                    type: "real_vector",
                    length: "16",
                })
                expect(table.findColumnByName("largeVector")).to.contain({
                    type: "real_vector",
                    length: "1536",
                    isNullable: true,
                })
                expect(table.findColumnByName("variableVector")).to.contain({
                    type: "real_vector",
                    length: "",
                })
            }),
        ))
})
