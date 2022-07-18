import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryColumn({ unsigned: true })
    id: number

    @Column({ zerofill: true })
    num: number
}
