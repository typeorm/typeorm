import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {Employee} from "./Employee";

@Entity()
export class Department {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Employee, {
        cascade: ["insert"],
        nullable: false
    })
    @JoinColumn()
    manager: Employee;

}