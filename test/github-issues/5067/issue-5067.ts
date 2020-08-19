import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {OracleDriver} from "../../../src/driver/oracle/OracleDriver";

describe.only("github issues > #5067 ORA-00972: identifier is too long", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    after(() => closeTestingConnections(connections));

    it("generated parameter name returns index instead of parameter name", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof OracleDriver)
        {
            const paramName = "output_";
            const parametersCount = 0;
            const createdParameter = await connection.driver.createParameter(paramName, parametersCount);

            expect(createdParameter).to.be.not.undefined;
            expect(createdParameter).to.be.not.null;
            expect(createdParameter).to.be.an("String");
            expect(createdParameter).to.not.match(/(?:output_)/);
            expect(await connection.driver.createParameter(paramName, 2)).to.equal(":" + 3);
        }
    })));
});
