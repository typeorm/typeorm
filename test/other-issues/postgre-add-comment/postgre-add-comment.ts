import { Connection } from "../../../src";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections } from "../../utils/test-utils";
import { Car } from "./entity/Car";
import { assert } from "chai";

describe("add comment for field in postgre", () => {
    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    
    beforeEach(() => reloadTestingDatabases(connections));

    after(() => closeTestingConnections(connections));

    it("should comment not undefined or empty", () => Promise.all(connections.map(async connection => {
        const entityFieldDescription: { column_name: string, description: string }[]
            = await connection.query("SELECT c.column_name, pgd.description FROM pg_catalog.pg_statio_all_tables AS st "
            + "INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid=st.relid) "
            + "RIGHT OUTER JOIN information_schema.columns c ON (pgd.objsubid=c.ordinal_position AND c.table_schema=st.schemaname AND c.table_name=st.relname) " 
            + "WHERE table_schema = $1 and table_name = $2;", [ "public", "connection.getMetadata(CarWithWheels).tableName" ]);
        
        const carColumns = connection.getMetadata(Car).columns;
        entityFieldDescription.forEach((it) => {
            const regularColumn = carColumns.find((entityColumn) => entityColumn.propertyName === it.column_name);

            assert.isNotNull(regularColumn);
            assert.equal(regularColumn!.comment, it.description);
        });
    })));
});