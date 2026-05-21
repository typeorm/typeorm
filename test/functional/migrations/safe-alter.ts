import { DataSource } from "typeorm";
import { assert } from "chai";

describe("Safe Alter Framework", () => {
    let dataSource: DataSource;

    before(async () => {
        dataSource = new DataSource({ /* config */ });
        await dataSource.initialize();
    });

    it("should widen VARCHAR without data loss", async () => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.query("CREATE TABLE test_safe_alter (val VARCHAR(50))");
        await queryRunner.query("INSERT INTO test_safe_alter (val) VALUES ('A'.repeat(50))");

        // Apply widening migration
        await queryRunner.changeColumn("test_safe_alter", {
            name: "val",
            type: "varchar",
            length: "100"
        });

        const result = await queryRunner.query("SELECT val FROM test_safe_alter");
        assert.equal(result[0].val.length, 50);
        
        const table = await queryRunner.getTable("test_safe_alter");
        assert.equal(table.columns.find(c => c.name === "val").length, 100);
        await queryRunner.release();
    });
});
