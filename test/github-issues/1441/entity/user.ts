import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "../../../../src/index";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    active: boolean;
}