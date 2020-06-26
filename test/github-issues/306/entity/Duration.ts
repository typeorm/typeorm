import { Column } from "@typeorm/core";

export class Duration {

    @Column({name: "duration_minutes"})
    durationMinutes: number;

    @Column({name: "duration_hours"})
    durationHours: number;

    @Column({name: "duration_days"})
    durationDays: number;

}
