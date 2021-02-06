import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src";
import { expect } from "chai";
import { Contact, Email, Phone, User } from "./entity";

describe("github issues > #7065 ChildEntity type relationship produces unexpected results", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Contact, Email, Phone, User],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should join child entity with discriminator value condition", () => Promise.all(connections.map(async connection => {
        const userRepo = connection.getRepository(User);

        const email = new Email();
        email.value = "email";

        const phone = new Phone();
        phone.value = "phone";

        const user = new User();
        user.name = "Mike";
        user.emails = [email];
        user.phones = [phone];
        await userRepo.save(user);

        const result = await userRepo.findOne(1, {
            relations: ["emails", "phones"]
        });

        expect(result!.emails.length).eq(1);
        expect(result!.emails[0].value).eq("email");
        expect(result!.phones.length).eq(1);
        expect(result!.phones[0].value).eq("phone");
    })));

});
