import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import { DateUtils } from "../../../src/util/DateUtils";

describe("other issues > date", () => {
    const localDateString = "2017-01-01";
    const localTimeString = "01:00:00";
    const localDateTimeString = localDateString + " " + localTimeString;
    const baseDate = new Date(localDateTimeString);
    const utcDateString = baseDate.toISOString().substring(0, 10);
    const utcTimeString = baseDate.toISOString().substr(11, 8);
    const utcDateTimeString = utcDateString + " " + utcTimeString;
    const localBaseDate = DateUtils.toDateObject(localDateTimeString, true);

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
        DateUtils.dateToDateString(baseDate, false).should.be.equal(utcDateString);
        DateUtils.dateToTimeString(baseDate, false).should.be.equal(utcTimeString);
        DateUtils.dateToDateTimeString(baseDate, false).should.be.equal(utcDateTimeString);

        // local
        if (new Date().getTimezoneOffset() === 0) { // if testing machine is +0 zone, then local time should be the same as UTC
            DateUtils.dateToDateString(baseDate, true).should.be.equal(utcDateString);
            DateUtils.dateToTimeString(baseDate, true).should.be.equal(utcTimeString);
            DateUtils.dateToDateTimeString(baseDate, true).should.be.equal(utcDateTimeString);
        } else {
            DateUtils.dateToDateString(baseDate, true).should.be.equal(localDateString);
            DateUtils.dateToTimeString(baseDate, true).should.be.equal(localTimeString);
            DateUtils.dateToDateTimeString(baseDate, true).should.be.equal(localDateTimeString);
        }

    });

    it("should persist and return correctly persisted dates", () => Promise.all(connections.map(async function(connection) {

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

        // test if accepts partial strings
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

        // compares if dates are equal
        const compareDate = (date: any, compareTo: Date) => (<Date> date).getTime() === compareTo.getTime();

        for (let post of loadedPosts) {

            expect(post.dateOnly).to.be.a("string");
            expect(post.timeOnly).to.be.a("string");
            expect(post.localTimeOnly).to.be.a("string");
            expect(post.localDateOnly).to.be.a("string");

            expect(compareDate(post.dateTime, baseDate)).to.be.true;
            expect(post.dateOnly === utcDateString).to.be.true;
            expect(post.timeOnly === utcTimeString).to.be.true;

            expect(compareDate(post.localDateTime, localBaseDate)).to.be.true;
            expect(post.localTimeOnly === localTimeString).to.be.true;
            expect(post.localDateOnly === localDateString).to.be.true;

        }

    })));

});