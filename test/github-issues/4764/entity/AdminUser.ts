import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";

@Entity()
export class AdminUser {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    email!: number;

    @Column()
    scopes!: string;

    @Column()
    name!: string;

    @Column()
    unid!: number;
}
