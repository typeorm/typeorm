import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import { expect } from "chai";
import { Connection } from "../../../src";
import { Project } from "./entity/Project";
import { ProjectSettings } from "./entity/ProjectSettings";

describe.only("github issues > #2373 Deletion of a cascaded entity fails because insert statement is created for cascaded entity", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Project, ProjectSettings],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should delete entity and cascaded entity", () => Promise.all(connections.map(async connection => {

        let projectRepo = connection.getRepository(Project);
        let settingsRepo = connection.getRepository(ProjectSettings);

        let project = new Project();

        project.settings = new ProjectSettings();;
        project = await projectRepo.save(project);

        await projectRepo.remove(project);

        expect(await projectRepo.count()).to.be.eql(0);
        expect(await settingsRepo.count()).to.be.eql(0);
    })));
});
