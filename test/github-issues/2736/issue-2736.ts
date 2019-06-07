import { Connection } from "../../../src";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections } from "../../utils/test-utils";
import { User } from "./entity/user";
import { Service } from "./entity/service";
import { expect } from "chai";

describe("github issues > #2736 should run correct query when using querybuilder with take, skip and orderBy", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [User, Service],
        });
    });
    beforeEach(async () => await reloadTestingDatabases(connections));
    after(async () => await closeTestingConnections(connections));

    it("should execute correct query when using querybuilder containing skip, take and orderBy", () => Promise.all(connections.map(async (connection) => {

        // create some users
        const user1 = new User("user 1");
        const user2 = new User("user 2");
        const user3 = new User("user 3");

        // create some services
        const service1 = new Service("service 1 for user1", user1);
        const service2 = new Service("service 2 for user1", user1);
        const service3 = new Service("service 1 for user2", user2);
        const service4 = new Service("service 1 for user3", user3);
        const service5 = new Service("service 2 for user3", user3);

        // store entities
        await connection.manager.save([user1, user2, user3, service1, service2, service3, service4, service5]);

        // create complex QueryBuilder
        const queryBuilder = connection.getRepository(Service).createQueryBuilder("service");
        queryBuilder
            .leftJoinAndSelect("service.user", "service_user")
            .where("service_user.name IN (:...names)", { names: [user1.name, user3.name] })
            .skip(0)
            .take(10)
            .orderBy("service_user.name", "ASC")
            .addOrderBy("service.title", "DESC");

        const services = await queryBuilder.getMany();

        // should return services for user1 and user3
        expect(services).to.have.length(4);

        // should be in right order
        expect(services).to.eql([
            service2,
            service1,
            service5,
            service4,
        ]);

    })));

});
