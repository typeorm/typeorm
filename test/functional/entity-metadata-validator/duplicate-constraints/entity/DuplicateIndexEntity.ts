import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Index } from "../../../../../src/decorator/Index"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
@Index("IDX_user_email_one", ["email"])
@Index("IDX_user_email_two", ["email"])
export class DuplicateIndexEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    email: string
}
