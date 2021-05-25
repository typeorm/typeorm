import "reflect-metadata";
import { assert } from "chai";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {SetDefault} from "./entity/SetDefault";

describe("github issues > #7163 Allow setting a default column value evaluated within typeORM at insert time rather than database DEFAULT", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        // enabledDrivers: ["postgres"], // - All drivers minus SAP (Should work but unable to test correctly locally)
        schemaCreate: true,
        dropSchema: true,
        entities: [SetDefault],
    }));
    after(() => closeTestingConnections(connections));

    it("should insert a row with default values generated at runtime", () => Promise.all(connections.map(async connection => {
        const entity = new SetDefault();
        return connection.manager.save(entity)
          .then(saved => {
            assert.isNull(saved.noDefault);
            assert.isNull(saved.defaultNull);
            assert.isNull(saved.setDefaultNull);
            assert.strictEqual(saved.id, 1);
            assert.strictEqual(saved.defaultString, "Hello");
            assert.strictEqual(saved.setDefaultString, "World");
            assert.strictEqual(saved.defaultBoolean, true);
            assert.strictEqual(saved.setDefaultBoolean, false);
            assert.strictEqual(saved.defaultNumber, 5);
            assert.strictEqual(saved.setDefaultNumber, 17);
            assert.isAtLeast(saved.setDefaultFunction, 0);
            assert.isBelow(saved.setDefaultFunction, 10);
          });
    })));
});
