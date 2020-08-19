import "reflect-metadata";
import {expect} from "chai";
import {Connection, getRepository} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {BigIntPkEntity} from "./entity/BigIntPkEntity";

describe("github issues > #6592 ER_DUP_ENTRY error when updating entity with bigint pk", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            entities: [BigIntPkEntity],
            schemaCreate: true,
            dropSchema: true
        });
    });
    after(() => closeTestingConnections(connections));

    it("should create bigIntPkEntity", async () => {
        const id = 9962902123;
        const name = "big int pk entity test";
        const quantity = 60;
        const entity = new BigIntPkEntity();
        entity.id = id;
        entity.name = name;
        entity.quantity = quantity;

        const result = await getRepository(BigIntPkEntity).save(entity);

        expect(result).to.not.be.undefined;
        expect(result.id).to.equal(id);
        expect(result.name).to.equal(name);
        expect(result.quantity).to.equal(quantity);
    });

    it("should get bigIntPkEntity", async () => {
        const id = 9962902123;
        const name = "big int pk entity test";
        const quantity = 60;
        const result: BigIntPkEntity | undefined = await getRepository(BigIntPkEntity).findOne(id);

        expect(result).to.not.be.undefined;
        expect(result ? result.id : null).to.equal(id);
        expect(result ? result.name : null).to.equal(name);
        expect(result ? result.quantity : null).to.equal(quantity);
    });

    it("should update bigIntPkEntity", async () => {
        const id = 9962902123;
        const name = "big int pk entity test";
        const quantity = 2;
        const entity = new BigIntPkEntity();
        entity.id = id;
        entity.name = name;
        entity.quantity = quantity;

        const result = await getRepository(BigIntPkEntity).save(entity);

        expect(result).to.not.be.undefined;
        expect(result.id).to.equal(id);
        expect(result.name).to.equal(name);
        expect(result.quantity).to.equal(quantity);
    });

    it("should remove bigIntPkEntity", async () => {
        const id = 9962902123;
        let result = await getRepository(BigIntPkEntity).delete({id: id});

        expect(result).to.not.be.undefined;
        expect(result.affected).to.equal(1);
    });
});
