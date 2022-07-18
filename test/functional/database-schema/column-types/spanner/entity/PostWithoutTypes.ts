import { Column, Entity, PrimaryColumn } from "../typeorm"

@Entity()
export class PostWithoutTypes {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    bool: boolean

    @Column()
    bytes: Buffer

    @Column()
    timestamp: Date
}
