import "reflect-metadata";
import { expect } from "chai";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import {User} from "../../functional/query-builder/update/entity/User";
import {EntityColumnNotFound} from "../../../src/error/EntityColumnNotFound";

describe("github issues > #3416 Unknown fields are stripped from WHERE clause", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [User]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("should throw EntityColumnNotFound when supplying unknown property in where criteria", () => {
        it("find", () => Promise.all(connections.map(async connection => {
            let error: Error | undefined;
            try {
                // @ts-ignore
                await connection.manager.findOne(User, {unknownProp: "John Doe"});
            } catch (err) {
                error = err;
            }
            expect(error).to.be.an.instanceof(EntityColumnNotFound);
        })));
        it("update", () => Promise.all(connections.map(async connection => {
            let error: Error | undefined;
            try {
                await connection.manager.update(User, { unknownProp: "Something" }, { name: "John doe "});
            } catch (err) {
                error = err;
            }
            expect(error).to.be.an.instanceof(EntityColumnNotFound);
        })));
        it("delete", () => Promise.all(connections.map(async connection => {
            let error: Error | undefined;
            try {
                await connection.manager.delete(User, { unknownProp: "Something" });
            } catch (err) {
                error = err;
            }
            expect(error).to.be.an.instanceof(EntityColumnNotFound);
        })));
    });
});
