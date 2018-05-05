import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "../../../../src/index";
import { RoleLevel } from "./role-level.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(type => RoleLevel, roleLevel => roleLevel.role, { cascade: true, eager: true })
  roleLevels: RoleLevel[];
}