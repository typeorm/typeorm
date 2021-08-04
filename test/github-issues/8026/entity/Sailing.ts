import { BaseEntity, Column, Entity, Index, JoinColumn, OneToMany, PrimaryColumn } from "../../../../src";
import { ScheduledSailing } from "./ScheduledSailing";

@Entity()
@Index(["scheduled_departure_time", "departure_terminal_id", "vessel_position_number"], { unique: true })
export class Sailing extends BaseEntity {
    @PrimaryColumn()
    departure_terminal_id: number;

    @PrimaryColumn()
    scheduled_departure_time: Date;

    @Column()
    vessel_position_number: number;

    @OneToMany(() => ScheduledSailing, (scheduledSailing) => scheduledSailing.sailing)
    @JoinColumn([
        { referencedColumnName: "departure_terminal_id", name: "departure_terminal_id" },
        { referencedColumnName: "vessel_position_number", name: "vessel_position_number" },
        { referencedColumnName: "scheduled_departure_time", name: "scheduled_departure_time" }
    ])
    scheduled_sailings: ScheduledSailing[];
}