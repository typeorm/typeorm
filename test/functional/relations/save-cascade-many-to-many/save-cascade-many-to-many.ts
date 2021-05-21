import { expect } from "chai";
import {Connection} from "../../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Business} from "./entity/Business";
import {ContactPerson} from "./entity/ContactPerson";


describe("Saving many-to-many relation through cascade", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Should save a new entity with its relations", () => Promise.all(connections.map(async connection => {
        const contactPerson = new ContactPerson();
        contactPerson.name = 'Cave Johnson';

        const business = new Business();
        business.name = 'Aperture Science';
        business.contactPersons = [
            contactPerson
        ];

        await connection.manager.save(business);

        const savedEntity = await connection.manager.find(Business, {
            relations: ["contactPersons"]
        });

        expect(savedEntity).be.eql([{
            id: 1,
            name: 'Aperture Science',
            contactPersons: [
                {
                    id: 1,
                    name: 'Cave Johnson',
                },
            ],
        }] as Business[]);
    })));

    it("Should update an entity with relations", () => Promise.all(connections.map(async connection => {
        const initialBusiness = new Business();
        initialBusiness.name = 'Aperture Laboratories';

        const initialResult = await connection.manager.save(initialBusiness);

        const contactPerson = new ContactPerson();
        contactPerson.name = 'Cave Johnson';

        const business = new Business();
        business.name = 'Aperture Science';
        business.contactPersons = [
            contactPerson
        ];

        await connection.manager.update(Business, { id: initialResult.id }, business);

        const savedEntity = await connection.manager.find(Business, {
            relations: ["contactPersons"]
        });

        expect(savedEntity).be.eql([{
            id: 1,
            name: 'Aperture Science',
            contactPersons: [
                {
                    id: 1,
                    name: 'Cave Johnson',
                },
            ],
        }] as Business[]);
    })));
})
