import {
  Entity,
  OneToMany,
  PrimaryColumn,
} from "../../../../src";
import WorkspaceMemberEntity from "./WorkspaceMemberEntity";

@Entity({ name: "user" })
export default class UserEntity {
  @PrimaryColumn({ length: 36 })
  id: string;

  @OneToMany(
    () => WorkspaceMemberEntity,
    (workspaceMembership) => workspaceMembership.user
  )
  workspaceMembers?: WorkspaceMemberEntity[];
}
