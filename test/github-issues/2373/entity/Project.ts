import { ProjectSettings } from "./ProjectSettings";
import { Entity, PrimaryGeneratedColumn, OneToOne } from "../../../../src";

@Entity('project')
export class Project {

    @PrimaryGeneratedColumn({ name: "id" })
    id?: number;
    @OneToOne(type => ProjectSettings, projectSettings => projectSettings.project, { cascade: true, eager: true })
    settings: ProjectSettings;

    constructor() {
        //this.settings = new ProjectSettings();
    }
}