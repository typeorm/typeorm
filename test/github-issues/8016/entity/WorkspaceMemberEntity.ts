import { Column, Entity, ManyToOne } from "../../../../src";;
import UserEntity from "./UserEntity";
import WorkspaceEntity from "./WorkspaceEntity";

export enum WorkspaceMemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

@Entity({ name: "workspace_member" })
export default class WorkspaceMemberEntity {
  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.members, {
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    primary: true,
  })
  workspace: WorkspaceEntity;

  @ManyToOne(() => UserEntity, (user) => user.workspaceMembers, {
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    primary: true,
  })
  user: UserEntity;

  @Column({ length: 64, default: WorkspaceMemberRole.MEMBER })
  role: WorkspaceMemberRole;
}
