import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Index } from "../../../../../src/decorator/Index"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
@Index("IDX_account_email", ["email"])
export class SingleIndexEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    email: string
}
