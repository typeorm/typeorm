import { StageType } from "./StageType";
import { ProcessTemplate } from "./ProcessTemplate";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src";

@Entity()
export class ProcessTemplateStage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    templateStageSpecificProp: string;

    @ManyToOne((type) => ProcessTemplate)
    @JoinColumn()
    processTemplate: ProcessTemplate;

    @ManyToOne((type) => StageType)
    @JoinColumn()
    stageType: StageType;
}
