import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "../../../../src";
import { Sailing } from "./Sailing";

@Entity()
export class ScheduledSailing extends BaseEntity {
    @PrimaryColumn()
    departure_terminal_id: number;

    @PrimaryColumn()
    scheduled_departure_time: Date;

    @Column()
    scheduled_arrival_time: Date;

    @Column()
    vessel_position_number: number;

    @ManyToOne(() => Sailing, (sailing) => sailing.scheduled_sailings)
        @JoinColumn([
        { referencedColumnName: "departure_terminal_id", name: "departure_terminal_id" },
        { referencedColumnName: "vessel_position_number", name: "vessel_position_number" },
        { referencedColumnName: "scheduled_departure_time", name: "scheduled_departure_time" }
    ])
    sailing: Sailing;
}
