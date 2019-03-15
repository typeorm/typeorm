import {Column, PrimaryGeneratedColumn, Entity} from "../../../../src";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number|null;

    @Column()
    name: string;

    @Column()
    name2: string|null;

}
