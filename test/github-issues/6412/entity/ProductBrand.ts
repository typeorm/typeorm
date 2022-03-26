import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "../../../../src"

@Entity()
export class ProductBrand extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public name: string

    @CreateDateColumn({
        name: "created_at",
        type: "datetime",
        precision: null,
        default: () => "CURRENT_TIMESTAMP",
    })
    public createdAt: Date

    @UpdateDateColumn({
        name: "updated_at",
        type: "datetime",
        precision: null,
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
    public updatedAt: Date
}
