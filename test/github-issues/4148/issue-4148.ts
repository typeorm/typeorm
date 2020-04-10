import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Book } from "./entity/Book";
import { expect } from "chai";

describe("github issues > #4148 MySQL 8.0.16: Now supports CHECK-Constraints", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Book],
                dropSchema: true,
                enabledDrivers: ["mysql"],
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should throw Volume checkConstraint if it's not satisfied", () => {
        return Promise.all(connections.map(async connection => {

            const qb = connection.manager
                .createQueryBuilder("Book", "book");

            await qb.insert()
                .into(Book)
                .values([
                    { name: "book1", nrOfPages: 600, volume: 0 }
                ])
                .execute()
                .catch(e => {
                    expect(e.toString()).to.contain("Check constraint 'VOLUME' is violated");
                });
        }));
    });

    it("should throw NrOfPages checkConstraint if it's not satisfied", () => {
        return Promise.all(connections.map(async connection => {
            const qb = connection.manager
                .createQueryBuilder("Book", "book");

            await qb.insert()
                .into(Book)
                .values([
                    { name: "book1", nrOfPages: 3, volume: 1 }
                ])
                .execute()
                .catch(e => {
                    expect(e.toString()).to.contain("Check constraint 'NR_OF_PAGES' is violated");
                });
        }));
    });

    it("should persist in DB if constraint is satisfied", () => {
        return Promise.all(connections.map(async connection => {
            const qb = connection.manager
                .createQueryBuilder("Book", "book");

            const bookRepository = connection.getRepository(Book);

            await qb.insert()
                .into(Book)
                .values([
                    { name: "book1", nrOfPages: 100, volume: 1 }
                ])
                .execute();

            const result = await bookRepository.find();
            expect(result).to.eql([{id: 1, name: "book1", nrOfPages: 100, volume: 1 }]);
        }));
    });
});
