import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {DeliveryNote} from "./entity/DeliveryNote";
import {expect} from "chai";

// unskip when inheritance will repaired
describe.skip("github issues > #78 repository 'create' is skipping inherited fields", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist successfully and return persisted entity", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(DeliveryNote);

        const deliveryNoteEntity = repository.create({
            id: 1,
            dollarRate: 0.5,
            orderBy: "money",
            comments: "this is comment",
            subTotal: 10,
            vat: 50,
            total: 60,
            createdBy: "Amir",
            invoice: "Total Invoice: 60"
        });

        expect(deliveryNoteEntity).not.to.be.empty;
        deliveryNoteEntity.should.be.instanceof(DeliveryNote);
        const simpleObject = Object.assign({}, deliveryNoteEntity);
        simpleObject.should.be.eql({
            dollarRate: 0.5,
            orderBy: "money",
            comments: "this is comment",
            subTotal: 10,
            vat: 50,
            total: 60,
            createdBy: "Amir",
            invoice: "Total Invoice: 60",
            id: 1
        });

    })));

});
