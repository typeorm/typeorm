import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../src";
import { ProcessTemplateStage } from "./ProcessTemplateStage";

@Entity()
export class ProcessTemplate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany((type) => ProcessTemplateStage, (stage) => stage.processTemplate)
    stages: ProcessTemplateStage[];
}
