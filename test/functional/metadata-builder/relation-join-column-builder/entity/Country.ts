import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Country {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
