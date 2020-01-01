import { Column, PrimaryColumn } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";

export enum Role {
  GuildMaster = "Guild Master",
  Officer = "Officer",
  Number = 1,
  PlayerAlt = "Player Alt"
}

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column({ type: "enum", enum: Role, default: [Role.GuildMaster], array: true })
  roles: Role[];
}
