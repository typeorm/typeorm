import { Project } from "./Project";
import { Entity, PrimaryColumn, JoinColumn, OneToOne } from "../../../../src";

@Entity('projectSettings')
export class ProjectSettings {
    @PrimaryColumn()
    projectId: number;
    @JoinColumn({ name: "projectId" })
    @OneToOne(type => Project, project => project.settings, { onDelete: 'CASCADE' })
    project: Project;
}