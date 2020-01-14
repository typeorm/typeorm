import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("query builder > where overlaps", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    async function prepareData(connection: Connection) {
        const posts = [
          {
            title: "Post One",
            date_start: "2009-07-01",
            date_end: "2010-05-01"
          },
          {
            title: "Post Two",
            date_start: "2009-10-01",
            date_end: "2009-12-01"
          },
          {
            title: "Post Three",
            date_start: "2009-09-01",
            date_end: "2010-11-01"
          },
          {
            title: "Post Four",
            date_start: "2009-12-01",
            date_end: "2010-02-01"
          },
          {
            title: "Post Five",
            date_start: "2009-09-01",
            date_end: "2010-03-01"
          }
        ];
        await connection.createQueryBuilder()
          .insert()
          .into(Post)
          .values(posts)
          .execute();  
    }

    it("should perform overlaps where condition on post start and end date", () => Promise.all(
        connections.map(async connection => {
            await prepareData(connection);

            const results = await connection.manager.createQueryBuilder(Post, "post")
              .whereOverlaps(["date_start", "date_end"], ["2010-09-01", "2010-01-01"])
              .getMany();

            expect(results.map(({title}) => title)).to.have.members(
                ["Post One", "Post Three", "Post Four", "Post Five"]
            );
        })
    ));
});
