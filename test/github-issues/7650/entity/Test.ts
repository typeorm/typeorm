import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Test {
    @PrimaryColumn()
    id: number

    @Column({
        type: "jsonb",
        default: { z: 1, a: 2 },
    })
    myjsoncolumn: string
}
