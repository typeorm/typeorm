import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {DataTransformationUtils} from "../../../src/util/DataTransformationUtils";
import {expect} from "chai";


describe("other issues > date", () => {
    const localTimeString = "01:00:00";
    const localDateString = "2017-01-01";
    const localDateTimeString = localDateString + " " + localTimeString;
    const baseDate = new Date(localDateString + " " + localTimeString);
    const utcDateString = baseDate.toISOString().substring(0, 10);
    const utcTimeString = baseDate.toISOString().substr(11, 8);
    const utcDateTimeString = utcDateString + " " + utcTimeString;

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{*.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should convert and format between UTC and local", () => {
        // UTC
        DataTransformationUtils.mixedDateToDateString(baseDate, false).should.be.equal(utcDateString);
        DataTransformationUtils.mixedDateToTimeString(baseDate, false).should.be.equal(utcTimeString);
        DataTransformationUtils.mixedDateToDatetimeString(baseDate, false).should.be.equal(utcDateTimeString);

        // local
        if (new Date().getTimezoneOffset() === 0) { // if testing machine is +0 zone, then local time should be the same as UTC
            DataTransformationUtils.mixedDateToDateString(baseDate, true).should.be.equal(utcDateString);
            DataTransformationUtils.mixedDateToTimeString(baseDate, true).should.be.equal(utcTimeString);
            DataTransformationUtils.mixedDateToDatetimeString(baseDate, true).should.be.equal(utcDateTimeString);
        } else {
            DataTransformationUtils.mixedDateToDateString(baseDate, true).should.be.equal(localDateString);
            DataTransformationUtils.mixedDateToTimeString(baseDate, true).should.be.equal(localTimeString);
            DataTransformationUtils.mixedDateToDatetimeString(baseDate, true).should.be.equal(localDateTimeString);
        }

    });

    it("should persist and return correct persisted dates", () => Promise.all(connections.map(async function(connection) {

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
        post.localTimeOnly = localTimeString;
        post.localDateOnly = localDateString;
        post.localDateTime = localDateTimeString;
        // UTC
        post.dateOnly = utcDateString;
        post.timeOnly = utcTimeString;
        post.dateTime = utcDateTimeString;

        await connection.entityManager.persist(post);

        // test if accepts full date string
        post = new Post();
        // Local
        post.localTimeOnly = localDateTimeString;
        post.localDateOnly = localDateTimeString;
        post.localDateTime = localDateTimeString;
        // UTC
        post.dateOnly = utcDateTimeString;
        post.timeOnly = utcDateTimeString;
        post.dateTime = utcDateTimeString;

        await connection.entityManager.persist(post);

        const loadedPosts = await connection.entityManager.find(Post);

        expect(loadedPosts).not.to.be.empty;
        for (let post of loadedPosts) {
            DataTransformationUtils.mixedDateToDatetimeString(post.dateTime).should.be.equal(utcDateTimeString);

            post.timeOnly.should.be.equal(utcTimeString);
            post.dateOnly.should.be.equal(utcDateString);

            if (new Date().getTimezoneOffset() === 0) { // if testing machine is +0 zone, then local time should be the same as UTC
                DataTransformationUtils.mixedDateToDatetimeString(post.localDateTime, true).should.be.equal(utcDateTimeString);
                post.localDateOnly.should.be.equal(utcDateString);
                post.localTimeOnly.should.be.equal(utcTimeString);
            } else {
                DataTransformationUtils.mixedDateToDatetimeString(post.localDateTime, true).should.be.equal(localDateTimeString);
                post.localDateOnly.should.be.equal(localDateString);
                post.localTimeOnly.should.be.equal(localTimeString);
            }
        }

    })));

});