import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import { getConnection } from "../../../src";
import { Project } from "./entity/Project";
import { ProjectSettings } from "./entity/ProjectSettings";

describe("github issues > #2373 Deletion of a cascaded entity fails because insert statement is created for cascaded entity", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should delete entity and cascaded entity", () => Promise.all(connections.map(async connection => {

       let projectRepo = getConnection("sqlite").getRepository(Project);
       let settingsRepo = getConnection("sqlite").getRepository(ProjectSettings);

       let project = new Project();
       let projectSettings = new ProjectSettings();

       project.settings = projectSettings;
       project = await projectRepo.save(project);

       projectRepo.remove(project);

       projectRepo.count().should.be.eql(0);
       settingsRepo.count().should.be.eql(0);

    })));
});