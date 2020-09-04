import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../../utils/test-utils";
import {Connection} from "../../../../../../src/connection/Connection";
import {Faculty} from "./entity/Faculty";
import {Professor} from "./entity/Professor";
import {Researcher} from "./entity/Researcher";

describe("table-inheritance > single-table > relations > one-to-many-cascade-save", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work correctly with OneToMany relations", () => Promise.all(connections.map(async connection => {

        // -------------------------------------------------------------------------
        // Create
        // -------------------------------------------------------------------------

        const researcher = new Researcher("Economics");
        await connection.getRepository(Researcher).save(researcher);

        const faculty1 = new Faculty();
        faculty1.name = "Economics";
        faculty1.staff = [ new Professor("Economics 101"), researcher ];
        await connection.getRepository(Faculty).save(faculty1);

        const loadedFaculty = await connection.getRepository(Faculty).findOne() as Faculty;

        loadedFaculty.staff[0].type.should.equal("PROFESSOR");
        loadedFaculty.staff[1].type.should.equal("RESEARCHER");
    })));

});
