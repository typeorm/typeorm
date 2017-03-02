import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Ticket} from "./entity/Ticket";
import {Request} from "./entity/Request";
import {expect} from "chai";

describe("github issues > #161 joinAndSelect can't find entity from inverse side of relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist successfully", () => Promise.all(connections.map(async connection => {

        const request = new Request();
        request.owner = "Umed";
        request.type = "ticket";
        request.success = false;

        const ticket = new Ticket();
        ticket.name = "ticket #1";
        ticket.request = request;

        await connection.entityManager.persist(ticket);

        const loadedTicketWithRequest = await connection.entityManager.findOneById(Ticket, 1, {
            join: {
                alias: "ticket",
                innerJoinAndSelect: {
                    "request": "ticket.request"
                }
            }
        });

        expect(loadedTicketWithRequest).not.to.be.empty;
        loadedTicketWithRequest!.should.be.eql({
            id: 1,
            name: "ticket #1",
            request: {
                id: 1,
                owner: "Umed",
                type: "ticket",
                success: false
            }
        });

        const loadedRequestWithTicket = await connection.entityManager.findOneById(Request, 1, {
            join: {
                alias: "request",
                innerJoinAndSelect: {
                    "ticket": "request.ticket"
                }
            }
        });

        loadedRequestWithTicket!.should.be.eql({
            id: 1,
            owner: "Umed",
            type: "ticket",
            success: false,
            ticket: {
                id: 1,
                name: "ticket #1"
            }
        });

    })));

    it("should return joined relation successfully", () => Promise.all(connections.map(async connection => {

        const authRequest = new Request();
        authRequest.owner = "somebody";
        authRequest.type = "authenticate";
        authRequest.success = true;

        await connection.entityManager.persist(authRequest);

        const request = new Request();
        request.owner = "somebody";
        request.type = "ticket";
        request.success = true;

        const ticket = new Ticket();
        ticket.name = "USD PAYMENT";

        ticket.request = request;
        request.ticket = ticket;

        await connection.entityManager.persist(request);

        const loadedRequest = await connection.entityManager.findOneById(Request, 2, {
            join: {
                alias: "request",
                innerJoinAndSelect: { ticket: "request.ticket" }
            }
        });

        expect(loadedRequest).not.to.be.undefined;
        loadedRequest!.should.be.eql({
            id: 2,
            owner: "somebody",
            type: "ticket",
            success: true,
            ticket: {
                id: 1,
                name: "USD PAYMENT"
            }
        });

    })));

});
