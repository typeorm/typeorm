import {BaseEntity, Entity, OneToMany, PrimaryColumn} from "../../../../src";
import {AccessEvent} from "./AccessEvent";

enum Providers {
    MS_GRAPH = 'msGraph',
    ATLASSIAN = 'atlassian'
}

@Entity()
export class Employee extends BaseEntity {
    @PrimaryColumn({ type: 'enum', enum: Providers })
    provider!: Providers

    @OneToMany(() => AccessEvent, (accessEvent) => accessEvent.employee)
    accessEvents!: AccessEvent[]
}
