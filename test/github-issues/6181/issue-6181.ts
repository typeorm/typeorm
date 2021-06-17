import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Post } from "./entity/Post";
import { expect } from "chai";
import { SelfReferencing } from "./entity/SelfReferencing";

describe("github issues > #6181 stackoverflow, OrmUtils.deepmerge with circular reference", () => {

    describe("without custom merge deep", () => {
        let connections: Connection[];
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true
            });
        });
        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should stack overflow", () => Promise.all(connections.map(async (connection) => {
            const id = 1;
            const selfReferencing = new SelfReferencing("some-value");

            const repository = connection.getRepository(Post);
            await expect(repository.save({id, selfReferencing})).to.rejectedWith(RangeError);
        })));
    });

    describe("with custom merge deep", () => {
        let connections: Connection[];
        before(async () => {
            connections = await createTestingConnections({
                customDeepMerge: [{
                    predicate: x => x instanceof SelfReferencing,
                    handler: x => x
                }],
                entities: [Post],
                schemaCreate: true,
                dropSchema: true
            });
        });
        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should correctly save and retrieve the entity", () => Promise.all(connections.map(async (connection) => {
            const id = 1;
            const selfReferencing = new SelfReferencing("some-value");

            const repository = connection.getRepository(Post);
            await repository.save({id, selfReferencing});

            const savedEntity = await repository.findOne(id);
            expect(savedEntity).not.to.be.undefined;
            expect(savedEntity!.selfReferencing).not.to.be.undefined;
            expect(savedEntity!.selfReferencing!.value).to.eq("some-value");
            expect(savedEntity!.selfReferencing!.self).to.eq(savedEntity!.selfReferencing!.self);
        })));
    });
});
