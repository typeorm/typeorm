import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Country {
    @PrimaryColumn()
    name: string

    @Column()
    region: string
}
