import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "../../src"

@Entity({ comment: "用户表" })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ comment: "用户名" })
    name: string

    @Column({ type: "simple-json", comment: "JSON数据", nullable: true })
    json: Record<string, any> | null

    @Column({
        type: "bool",
        comment: "是否在职",
        nullable: true,
        default: false,
    })
    onJob: boolean
}
