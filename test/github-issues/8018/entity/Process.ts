import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src";
import { Stage } from "./Stage";

@Entity()
export class Process {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name?: string;

    @OneToMany((type) => Stage, (stage) => stage.process)
    stages?: Stage[];
}
