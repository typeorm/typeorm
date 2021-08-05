import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Process } from "./entity/Process";
import { ProcessTemplate } from "./entity/ProcessTemplate";
import { ProcessTemplateStage } from "./entity/ProcessTemplateStage";
import { Stage } from "./entity/Stage";
import { StageType } from "./entity/StageType";

describe("github issues > #8018 Two entities pointing to the same entity using the same property name will cause mixup", () => {

    let connections: Connection[];
    before(async () =>(connections = await createTestingConnections({
        entities: [Process,ProcessTemplate,ProcessTemplateStage,Stage,StageType],
        schemaCreate: true,
        dropSchema: true,
    })));
    beforeEach(async () => await reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Should parse the child entities as the correct type", async () => await Promise.all(connections.map(async (connection) => {

        const pts = new ProcessTemplateStage();
        pts.name = "some prt stage";
        pts.templateStageSpecificProp = "some value here";

        const pts2 = new ProcessTemplateStage();
        pts2.name = "some prt stage 2";
        pts2.templateStageSpecificProp = "text";

        const pt = new ProcessTemplate();
        pt.name = "some template";
        pt.stages = [pts, pts2];

        await connection.manager.save([pt, pts, pts2]);

        const processTemplates = await connection.manager.getRepository(ProcessTemplate).find({
            relations: ["stages", "stages.stageType"],
        });

        expect(processTemplates).to.have.lengthOf(1);
        expect(processTemplates[0].stages).to.have.lengthOf(2);
        expect(processTemplates[0].stages[0]).to.be.instanceOf(ProcessTemplateStage);
        expect(processTemplates[0].stages[1]).to.be.instanceOf(ProcessTemplateStage);
        expect(processTemplates[0].stages[1].id).to.equal(2);
        expect(processTemplates[0].stages[1].templateStageSpecificProp).to.equal("text");
    })));
});
