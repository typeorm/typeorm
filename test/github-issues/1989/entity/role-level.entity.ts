import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "../../../../src/index";
import { Role } from "./role.entity";

@Entity()
export class RoleLevel {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: false })
  roleId: number;

  @ManyToOne(type => Role, role => role.roleLevels, { nullable: false, onDelete: "CASCADE" })
  role: Role;

}