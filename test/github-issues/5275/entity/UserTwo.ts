import { Column, PrimaryColumn } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { Role } from "./User";

@Entity()
export class UserTwo {
  @PrimaryColumn()
  id: number;

  @Column({ type: "enum", enum: Role, default: Role.GuildMaster })
  role: Role;
}
