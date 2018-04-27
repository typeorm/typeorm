import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RoleLevel } from './role-level.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(type => RoleLevel, roleLevel => roleLevel.role, { cascade: true, eager: true })
  roleLevels: RoleLevel[];
}