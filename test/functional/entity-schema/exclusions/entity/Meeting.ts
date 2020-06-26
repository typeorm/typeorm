import { EntitySchema } from "@typeorm/core";

export const MeetingSchema = new EntitySchema<any>({
    name: "Meeting",
    columns: {
        Id: {
            primary: true,
            type: "int",
            generated: "increment"
        },
        StartsAt: {
            type: Date,
            nullable: false
        },
        FinishesAt: {
            type: Date,
            nullable: false
        }
    },
    exclusions: [
        {expression: `USING gist (tsrange("StartsAt", "FinishesAt") WITH &&)`}
    ]
});
