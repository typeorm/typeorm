import "reflect-metadata";

import { expect } from "chai";

import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";
import { Book } from "./entity/Book";
import { User } from "./entity/User";

describe("github issues > #3576 Error when saving an entity after lazy loading its relations: TypeError: Cannot read property 'find' of undefined", () => {
    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            schemaCreate: true,
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        });
    });

    after(() => closeTestingConnections(connections));

    it("shouldn't blow up when you try to save it after loading one of its relations", async () => {
        const usersRepo = connections[0].getRepository(User);
        const booksRepo = connections[0].getRepository(Book);

        const author = new User();
        author.name = "Vince Coppola";
        await usersRepo.save(author);

        const book1 = new Book();
        book1.author = author;
        book1.title = "This Better Work";
        await booksRepo.save(book1);

        const testAuthor = await usersRepo.findOneOrFail();

        // Historically, this was the step that would cause the subsequent save
        // operation to throw.
        await testAuthor.books;

        await usersRepo.save(testAuthor);

        // If we made it this far, we're in the clear!
        expect(true);
    });
});
