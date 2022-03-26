import "reflect-metadata"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"

describe.only("database schema > generated columns > mysql", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly create table with generated columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")
                const virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                const storedFullName =
                    table!.findColumnByName("storedFullName")!
                const name = table!.findColumnByName("name")!
                const nameHash = table!.findColumnByName("nameHash")!
                const complexColumn = table!.findColumnByName("complexColumn")!

                virtualFullName.asExpression!.should.be.equal(
                    "concat(`firstName`,' ',`lastName`)",
                )
                virtualFullName.generatedType!.should.be.equal("VIRTUAL")
                storedFullName.asExpression!.should.be.equal(
                    "CONCAT(`firstName`,' ',`lastName`)",
                )
                storedFullName.generatedType!.should.be.equal("STORED")
                name.asExpression!.should.be.equal("`firstName` || `lastName`")
                nameHash.asExpression!.should.be.equal(
                    "md5(coalesce(`firstName`,0))",
                )
                complexColumn.asExpression!.should.be.equal(
                    "concat(if(((not `useTitle`) or IsNull(`title`)), '', concat(`firstName`,' ', `lastName`)))",
                )

                await queryRunner.release()
            }),
        ))

    // it("should correctly create table with generated columns", () =>
    //     Promise.all(
    //         dataSources.map(async (dataSource) => {
    //             const queryRunner = dataSource.createQueryRunner()
    //             let table = await queryRunner.getTable("post")
    //             table!
    //                 .findColumnByName("virtualFullName")!
    //                 .asExpression!.should.be.equal(
    //                     "concat(`firstName`,' ',`lastName`)",
    //                 )
    //             table!
    //                 .findColumnByName("virtualFullName")!
    //                 .generatedType!.should.be.equal("VIRTUAL")
    //             table!
    //                 .findColumnByName("storedFullName")!
    //                 .asExpression!.should.be.equal(
    //                     "concat(`firstName`,' ',`lastName`)",
    //                 )
    //             table!
    //                 .findColumnByName("storedFullName")!
    //                 .generatedType!.should.be.equal("STORED")
    //
    //             const metadata = dataSource.getMetadata(Post)
    //             const virtualFullNameColumn =
    //                 metadata.findColumnWithPropertyName("virtualFullName")
    //             virtualFullNameColumn!.generatedType = "STORED"
    //
    //             const storedFullNameColumn =
    //                 metadata.findColumnWithPropertyName("storedFullName")
    //             storedFullNameColumn!.asExpression =
    //                 "concat('Mr. ',`firstName`,' ',`lastName`)"
    //             await dataSource.synchronize()
    //
    //             table = await queryRunner.getTable("post")
    //             table!
    //                 .findColumnByName("virtualFullName")!
    //                 .generatedType!.should.be.equal("STORED")
    //             table!
    //                 .findColumnByName("storedFullName")!
    //                 .asExpression!.should.be.equal(
    //                     "concat('Mr. ',`firstName`,' ',`lastName`)",
    //                 )
    //
    //             await queryRunner.release()
    //         }),
    //     ))

    it("should not generate queries when no model changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.driver.createSchemaBuilder().build()
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries.length.should.be.equal(0)
                sqlInMemory.downQueries.length.should.be.equal(0)
            }),
        ))
})
