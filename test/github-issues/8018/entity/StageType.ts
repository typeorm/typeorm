import { Entity, PrimaryColumn, Column, OneToMany } from "../../../../src";
import { Stage } from "./Stage";

@Entity()
export class StageType {
    @PrimaryColumn()
    id: number;

    @Column()
    name: number;

    @OneToMany((type) => Stage, (stage) => stage.stageType)
    stages: Stage[];
}
