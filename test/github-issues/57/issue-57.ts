import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {User} from "./entity/User";
import {expect} from "chai";
import {AccessToken} from "./entity/AccessToken";

describe("github issues > #57 cascade insert not working with OneToOne relationship", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist successfully from owner side", () => Promise.all(connections.map(async connection => {

        // create
        const token = new AccessToken();
        const user = new User();
        user.email = "mwelnick@test.com";
        user.access_token = token; // this is necessary to cascades to work because we are saving user, not token
        token.user = user; // this is not necessary at all

        // save
        await connection.getRepository(User).save(user);

        // get to check
        const tokens = await connection.getRepository(AccessToken)
            .createQueryBuilder("token")
            .innerJoinAndSelect("token.user", "user")
            .getMany();

        // get from inverse side and check
        const users = await connection.getRepository(User)
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.access_token", "token")
            .getMany();

        expect(users).not.to.be.empty;
        users.should.be.eql([{
            primaryKey: 1,
            email: "mwelnick@test.com",
            access_token: {
                primaryKey: 1
            }
        }]);

        expect(tokens).not.to.be.empty;
        tokens.should.be.eql([{
            primaryKey: 1,
            user: {
                primaryKey: 1,
                email: "mwelnick@test.com",
            }
        }]);

    })));

    it("should persist successfully from inverse side", () => Promise.all(connections.map(async connection => {

        // create
        const token = new AccessToken();
        const user = new User();
        user.email = "mwelnick@test.com";
        user.access_token = token; // this is not necessary at all
        token.user = user; // this is necessary to cascades to work because we are saving token, not user

        // save
        await connection.getRepository(AccessToken).save(token);

        // get to check
        const tokens = await connection.getRepository(AccessToken)
            .createQueryBuilder("token")
            .innerJoinAndSelect("token.user", "user")
            .getMany();

        expect(tokens).not.to.be.empty;
        tokens.should.be.eql([{
            primaryKey: 1,
            user: {
                primaryKey: 1,
                email: "mwelnick@test.com",
            }
        }]);

        // get from inverse side and check
        const users = await connection.getRepository(User)
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.access_token", "token")
            .getMany();

        expect(users).not.to.be.empty;
        users.should.be.eql([{
            primaryKey: 1,
            email: "mwelnick@test.com",
            access_token: {
                primaryKey: 1
            }
        }]);

    })));

});
