import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class City {
    @PrimaryColumn()
    name: string

    @PrimaryColumn()
    countryName: string

    @Column()
    population: number
}
