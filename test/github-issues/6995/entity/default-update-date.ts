import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
} from "typeorm"

@Entity()
export class DefaultUpdateDate {
    @PrimaryGeneratedColumn({
        type: "int",
    })
    public id: number

    @CreateDateColumn()
    public createdDate: Date

    @UpdateDateColumn()
    public updatedDate: Date
}
