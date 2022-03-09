import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Configuration } from "./entity/Configuration";
import { ConfigurationRepository } from "./repository/ConfigurationRepository";

describe("github issues > #7113 Soft deleted docs still being pulled in Mongodb", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mongodb"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not pull soft deleted docs with find", () => Promise.all(connections.map(async connection => {

        const repository = connection.getCustomRepository(ConfigurationRepository);
        const configuration = new Configuration();
        
        await repository.save(configuration);

        await repository.deleteConfiguration(configuration);

        const withoutDeleted = await repository.findAllConfigurations();        
        expect(withoutDeleted.length).to.be.eq(0);

        const withDeleted = await repository.find({ withDeleted: true });
        expect(withDeleted.length).to.be.eq(1);

        const withOtherOption = await repository.find({order: { _id: "ASC" }});
        expect(withOtherOption.length).to.be.eq(0);

    })));

    it("should not pull soft deleted docs with findAndCount", () => Promise.all(connections.map(async connection => {

        const repository = connection.getCustomRepository(ConfigurationRepository);
        const configuration = new Configuration();
        
        await repository.save(configuration);

        await repository.softRemove(configuration);

        const withoutDeletedAndCount = await repository.findAndCount();        
        expect(withoutDeletedAndCount[0].length).to.be.eq(0);

        const withDeletedAndCount = await repository.findAndCount({ withDeleted: true });
        expect(withDeletedAndCount[0].length).to.be.eq(1);

        const withOtherOptionAndCount = await repository.findAndCount({order: { _id: "ASC" }});
        expect(withOtherOptionAndCount[0].length).to.be.eq(0);

    })));

    it("should not pull soft deleted docs with findByIds", () => Promise.all(connections.map(async connection => {

        const repository = connection.getCustomRepository(ConfigurationRepository);
        const configuration = new Configuration();
        
        await repository.save(configuration);

        await repository.softRemove(configuration);

        const withoutDeletedById = await repository.findByIds([configuration._id]);
        expect(withoutDeletedById.length).to.be.eq(0);

        const withDeletedById = await repository.findByIds([configuration._id],
            { withDeleted: true });
        expect(withDeletedById.length).to.be.eq(1);

        const withOtherOptionById = await repository.findByIds([configuration._id],
            { cache: true });
        expect(withOtherOptionById.length).to.be.eq(0);

    })));

    it("should not pull soft deleted docs with findOne", () => Promise.all(connections.map(async connection => {

        const repository = connection.getCustomRepository(ConfigurationRepository);
        const configuration = new Configuration();
        
        await repository.save(configuration);

        await repository.softRemove(configuration);

        const withoutDeletedOne = await repository.findOne(configuration._id);        
        expect(withoutDeletedOne).to.be.undefined;

        const withDeletedOne = await repository.findOne(configuration._id,
            { withDeleted: true });
        expect(withDeletedOne).not.to.be.undefined;

        const withOtherOptionOne = await repository.findOne(configuration._id,
            { cache: true });
        expect(withOtherOptionOne).to.be.undefined;

    })));

});