import {Column, Entity, PrimaryGeneratedColumn, TableInheritance} from '../../../../src';

@Entity()
@TableInheritance({ column: { name: "type", type: "varchar" }})
export class Vehicle {

    @PrimaryGeneratedColumn()
    public id?: number;

    @Column()
    public seats: number;

}