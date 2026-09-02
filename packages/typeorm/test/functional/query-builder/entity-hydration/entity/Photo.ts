import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Photo {
    @PrimaryColumn()
    id: number

    @Column()
    url: string
}
