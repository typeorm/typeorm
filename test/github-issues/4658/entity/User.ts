import { Entity } from "typeorm"
import { PrimaryColumn } from "typeorm"
import { CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @CreateDateColumn()
    created_at: number

    @UpdateDateColumn()
    updated_at: string
}
