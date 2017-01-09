import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {DataTransformationUtils} from "../../../src/util/DataTransformationUtils";
import {expect} from "chai";


describe("other issues > date", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{*.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should convert and format between UTC and local", () => {
        const baseDate = new Date("2017-01-01 01:00:00+200"); // UTC + 2 hours

        // UTC
        DataTransformationUtils.mixedDateToDateString(baseDate, false).should.be.equal("2016-12-31");
        DataTransformationUtils.mixedDateToTimeString(baseDate, false).should.be.equal("23:00:00");
        DataTransformationUtils.mixedDateToDatetimeString(baseDate, false).should.be.equal("2016-12-31 23:00:00");

        // local
        DataTransformationUtils.mixedDateToDateString(baseDate, true).should.be.equal("2017-01-01");
        DataTransformationUtils.mixedDateToTimeString(baseDate, true).should.be.equal("01:00:00");
        DataTransformationUtils.mixedDateToDatetimeString(baseDate, true).should.be.equal("2017-01-01 01:00:00");

    });

    it("should persist and return correct persisted dates", () => Promise.all(connections.map(async function(connection) {
        const baseDate = new Date("2017-01-01 01:00:00+200"); // UTC + 2 hours

        let post = new Post();
        // Local time
        post.localTimeOnly = new Date(baseDate);
        post.localDateOnly = new Date(baseDate);
        post.localDateTime = new Date(baseDate);
        // UTC time
        post.dateOnly = new Date(baseDate);
        post.timeOnly = new Date(baseDate);
        post.dateTime = new Date(baseDate);

        await connection.entityManager.persist(post);

        post = new Post();
        // Local
        post.localTimeOnly = "01:00:00";
        post.localDateOnly = "2017-01-01";
        post.localDateTime = "2017-01-01 01:00:00";
        // UTC
        post.dateOnly = "2016-12-31";
        post.timeOnly = "23:00:00";
        post.dateTime = "2016-12-31 23:00:00";

        await connection.entityManager.persist(post);

        // test if accepts full date string
        post = new Post();
        // Local
        post.localTimeOnly = "2017-01-01 01:00:00";
        post.localDateOnly = "2017-01-01 01:00:00";
        post.localDateTime = "2017-01-01 01:00:00";
        // UTC
        post.dateOnly = "2016-12-31 01:00:00";
        post.timeOnly = "2016-12-31 23:00:00";
        post.dateTime = "2016-12-31 23:00:00";

        await connection.entityManager.persist(post);

        const loadedPosts = await connection.entityManager.find(Post);

        expect(loadedPosts).not.to.be.empty;
        for (let post of loadedPosts) {
            DataTransformationUtils.mixedDateToDatetimeString(post.localDateTime, true).should.be.equal("2017-01-01 01:00:00");
            DataTransformationUtils.mixedDateToDatetimeString(post.dateTime).should.be.equal("2016-12-31 23:00:00");

            post.timeOnly.should.be.equal("23:00:00");
            post.dateOnly.should.be.equal("2016-12-31");
            post.localDateOnly.should.be.equal("2017-01-01");
            post.localTimeOnly.should.be.equal("01:00:00");
        }

    })));

});