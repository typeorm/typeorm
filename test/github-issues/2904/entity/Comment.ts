import { Column, CreateDateColumn } from "typeorm"

export class Comment {
    @CreateDateColumn()
    createdAt: Date

    @Column()
    savedBy: string
}
