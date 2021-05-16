import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {User, UserInfo} from "./entity/user";

describe("github issues > #966 Inheritance in embeddables", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save and load Superclass fields in embeddable", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(User);
        
        const info = new UserInfo();
        info.firstName = "Ed";
        info.lastName = "Edd";
        info.userName = "Eddy";
        info.address = "github.com";
        
        const user = new User();
        user.info = info;

        await repository.save(user);

        const loadedUser = await repository.findOne(user.id);

        expect(info).to.deep.equal(loadedUser!.info);
    })));

});
