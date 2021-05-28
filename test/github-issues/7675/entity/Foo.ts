import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";

@Entity()
export class Foo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    someField: Date;
}
