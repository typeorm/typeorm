import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {User} from "./entity/User";
import {UserCredential} from "./entity/UserCredential";

describe("github issues > #836 .save won't update entity when it contains OneToOne relationship", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work perfectly", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.email = "user@user.com";
        user.username = "User User";
        user.privilege = 0;
        await connection.manager.save(user);

        const credential = new UserCredential();
        credential.password = "ABC";
        credential.salt = "CDE";
        credential.user = user;
        await connection.manager.save(credential);

        // const loadedCredentials = await connection.manager.findOneById(UserCredential, 1, {
        //     alias: "user_credential",
        //     innerJoinAndSelect: {
        //         user: "user_credential.user",
        //     },
        // });

        // todo: finish this test - cascades needs to be fixed first.

    })));

});
