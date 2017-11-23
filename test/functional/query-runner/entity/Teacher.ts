import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Student} from "./Student";
import {OneToMany} from "../../../../src/decorator/relations/OneToMany";

@Entity()
export class Teacher {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Student, student => student.teacher)
    students: Student[];

}