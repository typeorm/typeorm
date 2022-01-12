import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { InternalUser } from "./entity/InternalUser";
import { InternalRole } from "./entity/InternalRole";
import { User } from "./entity/User";
import { Role } from "./entity/Role";

describe("github issues > #8522 Single table inheritance returns the same discriminator value error for unrelated tables where their parents extend from the same entity", () => {
    let connections: Connection[];
    
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should loads internal user and internal role", () => Promise.all(connections.map(async connection => {
        const id = 1;
        const date = new Date();
    
        const firstName = "Jane";
        const lastName = "Walker";
    
        const name = "admin";
        const description = "All permissions";

        const internalUser = new InternalUser();
        internalUser.id = id;
        internalUser.firstName = firstName;
        internalUser.lastName = lastName;
        internalUser.createdAt = date;
        internalUser.updatedAt = date;

        await connection.manager.save(internalUser);

        const internalRole = new InternalRole();
        internalRole.id = id;
        internalRole.name = name;
        internalRole.description = description;
        internalRole.createdAt = date;
        internalRole.updatedAt = date;

        await connection.manager.save(internalRole);

        let users = await connection.manager
        .createQueryBuilder(User, "user")
        .getMany();
 
        expect(users[0].id).to.be.equal(id);
        expect(users[0].firstName).to.be.equal(firstName);
        expect(users[0].lastName).to.be.equal(lastName);
        expect(users[0].createdAt.should.be.instanceOf(Date));
        expect(users[0].updatedAt.should.be.instanceOf(Date));

        let roles = await connection.manager
        .createQueryBuilder(Role, "role")
        .getMany();
 
        expect(roles[0].id).to.be.equal(id);
        expect(roles[0].name).to.be.equal(name);
        expect(roles[0].description).to.be.equal(description);
        expect(roles[0].createdAt.should.be.instanceOf(Date));
        expect(roles[0].updatedAt.should.be.instanceOf(Date));
    })));
});