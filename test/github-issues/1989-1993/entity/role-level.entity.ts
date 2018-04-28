import { Entity, Column, ManyToOne, OneToMany, Index, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { Role } from './role.entity';

@Entity()
export class RoleLevel {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  levelId: number;

  @Column({ nullable: true })
  gradingId: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: false })
  roleId: number;

  @ManyToOne(type => Role, role => role.roleLevels, { nullable: false, onDelete: 'CASCADE' })
  role: Role;

}