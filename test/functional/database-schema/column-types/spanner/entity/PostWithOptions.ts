import { Column, Entity, PrimaryColumn } from "../typeorm"

@Entity()
export class PostWithOptions {
    @PrimaryColumn()
    id: number

    @Column({ length: 50 })
    string: string

    @Column({ length: 50 })
    bytes: Buffer
}
