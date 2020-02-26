import {PrimaryGeneratedColumn, Column, Entity} from "../../../../../src";

@Entity()
export class Numeric {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    value: number;
}
