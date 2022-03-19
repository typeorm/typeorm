import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryColumn({ unsigned: true })
    id: number

    @Column({ zerofill: true })
    num: number
}
