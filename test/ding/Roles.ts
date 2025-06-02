import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "../../src"

@Entity({ comment: "角色表" })
export class Roles extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "int", comment: "用户ID" })
    userId: number

    @Column({ type: String, length: 80, comment: "角色名" })
    name: string
}
