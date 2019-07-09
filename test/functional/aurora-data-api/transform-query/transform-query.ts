import "reflect-metadata";
import {expect} from "chai";
import {AuroraDataApiQueryRunner} from "../../../../src/driver/aurora-data-api/AuroraDataApiQueryRunner";
import {AuroraDataApiDriver} from "../../../../src/driver/aurora-data-api/AuroraDataApiDriver";
import {Connection} from "../../../../src";

describe("aurora data api > query transformation", () => {
    const queryRunner = new AuroraDataApiQueryRunner(new AuroraDataApiDriver(new Connection({
        type: "aurora-data-api",
        database: "test-db",
        secretArn: "test-secret-arn",
        resourceArn: "test-resource-arn",
        region: "eu-west-1",
        logging: true,
    })));

    it("should correctly transform a single parameter query", async () => {
        const query = "select * from posts where id = ?";
        const parameters = [1];

        const result = queryRunner.transformQueryAndParameters(query, parameters);

        expect(result.queryString).to.eql("select * from posts where id = :param_0");
        expect(result.parameters).to.eql([{ param_0: 1 }]);
    });

    it("should correctly transform a query with escaped quotation marks", async () => {
        const query = "select * from posts where id = ? and text = \"?\" and title = \"\\\"?\\\"\"";
        const parameters = [1];

        const result = queryRunner.transformQueryAndParameters(query, parameters);

        expect(result.queryString).to.eql("select * from posts where id = :param_0 and text = \"?\" and title = \"\\\"?\\\"\"");
        expect(result.parameters).to.eql([{ param_0: 1 }]);
    });


    it("should correctly transform a query with escaped apostrophes", async () => {
        const query = "select * from posts where id = ? and text = '?' and title = '\\'?\\'' and description = \"\'?\'\"";
        const parameters = [1];

        const result = queryRunner.transformQueryAndParameters(query, parameters);

        expect(result.queryString).to.eql("select * from posts where id = :param_0 and text = '?' and title = '\\'?\\'' and description = \"\'?\'\"");
        expect(result.parameters).to.eql([{ param_0: 1 }]);
    });
});
