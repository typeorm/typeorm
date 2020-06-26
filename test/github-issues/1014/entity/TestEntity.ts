import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class TestEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
