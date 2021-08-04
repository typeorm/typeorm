import "reflect-metadata";
import {getRepository} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import UserEntity from "./entity/UserEntity";
import WorkspaceEntity from "./entity/WorkspaceEntity";
import WorkspaceMemberEntity, {WorkspaceMemberRole} from "./entity/WorkspaceMemberEntity";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

describe.only("github issues > #8016 Cannot find alias for relation at user", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be able to perform the update", async () => await Promise.all(connections.map(async connection => {
        const user = await getRepository(UserEntity).save({
            id: "user-id"
        });
        expect(user.id).equal("user-id");
        const workspace = await getRepository(WorkspaceEntity).save({
            id: "workspace-id"
        });
        expect(workspace.id).equal("workspace-id");
        let membership: WorkspaceMemberEntity | undefined = await getRepository(WorkspaceMemberEntity).save({
            user,
            workspace,
            role: WorkspaceMemberRole.ADMIN
        });
        expect(membership.role).equal(WorkspaceMemberRole.ADMIN);
            await getRepository(WorkspaceMemberEntity).update(
            {
                user: {
                    id: "user-id",
                },
                workspace: {
                    id: "workspace-id",
                },
            },
            {
                role: WorkspaceMemberRole.MEMBER,
            }
        );
            membership = await getRepository(WorkspaceMemberEntity).findOne({
            user,
            workspace,
        });
        expect(membership?.role).equal(WorkspaceMemberRole.MEMBER);
    })));

});
