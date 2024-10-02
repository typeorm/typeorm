import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Category } from "./entity/category"
import {expect} from "chai";

describe("github issues > #11077 TypeORM does not compose the correct SQL", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["postgres"],
                logging: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should use the table alias during an insert when using postgres driver", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepo = dataSource.getRepository(Category)
                const mockCategories = ["Video", "Photo", "Moto"].map(
                    (name, index) => ({ name, id: index }),
                )

                const query = categoryRepo
                    .createQueryBuilder()
                    .insert()
                    .values(
                        mockCategories.map((category) => ({
                            id: category.id,
                            name: category.name,
                        })),
                    )
                    .orUpdate(["name"], ["id"], {
                        skipUpdateIfNoValuesChanged: true,
                    })

                expect(query.getSql()).to.be.eql(
                    'INSERT INTO "category" AS "Category"("name")' +
                    ' VALUES ($1), ($2), ($3)' +
                    ' ON CONFLICT ( "id" ) DO UPDATE' +
                    ' SET "name" = EXCLUDED."name" ' +
                    ' WHERE ("Category"."name" IS DISTINCT FROM EXCLUDED."name")'
                )
                expect(await query.execute()).not.to.throw;
            }),
        ))
})
