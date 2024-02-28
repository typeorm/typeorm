import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource} from "../../../src"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("github issues > #10263 Postgres @Tree specify schema for closure tables", () => {

    let dataSources: DataSource[];
    before(async () => dataSources = await createTestingConnections({
        entities: [Category],
        enabledDrivers: ["postgres"],
    }));
    beforeEach(() => reloadTestingDatabases(dataSources));
    after(() => closeTestingConnections(dataSources));

    it("should create the closure table in the specified schema", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = (await queryRunner.getTable("test_schema.category_xyz_closure"))!
                expect(table.database).to.not.be.undefined
                expect(table.schema).to.be.equal("test_schema")
                expect(table.name).to.be.equal("test_schema.category_xyz_closure")
                await queryRunner.release()
            }),
        )
    )

    it("should have correctly named ancestor and descendant columns", async () => {
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner();
                const table = await queryRunner.getTable("test_schema.category_xyz_closure");
                const ancestorColumn = table?.columns.find(column => column.name === "ancestor_xyz_id");
                const descendantColumn = table?.columns.find(column => column.name === "descendant_xyz_id");
                expect(ancestorColumn).to.exist;
                expect(descendantColumn).to.exist;
                await queryRunner.release();
            }),
        )
    });

})
