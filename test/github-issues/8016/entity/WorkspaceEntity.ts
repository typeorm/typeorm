import {
  Entity,
  OneToMany,
  PrimaryColumn,
} from "../../../../src";
import WorkspaceMemberEntity from "./WorkspaceMemberEntity";

@Entity({ name: "workspace" })
export default class WorkspaceEntity {
  @PrimaryColumn({ length: 36 })
  id: string;

  @OneToMany(
    () => WorkspaceMemberEntity,
    (workspaceMembership) => workspaceMembership.workspace
  )
  members?: WorkspaceMemberEntity[];
}
