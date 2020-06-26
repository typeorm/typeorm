import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PersonAR extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
