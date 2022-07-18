import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn({ nullable: false })
    id: number

    @Column()
    name: string
}
