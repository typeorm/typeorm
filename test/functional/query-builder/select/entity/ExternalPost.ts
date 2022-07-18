import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class ExternalPost {
    @PrimaryColumn()
    outlet: string

    @PrimaryColumn()
    id: number

    @Column()
    title: string
}
