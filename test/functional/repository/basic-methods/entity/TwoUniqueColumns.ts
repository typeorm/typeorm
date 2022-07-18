import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TwoUniqueColumnsEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ unique: true })
    externalId: string

    @Column({ unique: true })
    email: string

    @Column()
    name: string
}
