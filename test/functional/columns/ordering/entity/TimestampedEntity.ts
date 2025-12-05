import {
    CreateDateColumn,
    DeleteDateColumn,
    Order,
    Orderable,
    UpdateDateColumn,
} from "../../../../../src"

@Orderable()
export class TimestampedEntity {
    @Order({ priority: 100 })
    @CreateDateColumn()
    createdAt!: Date

    @Order({ priority: 102 })
    @UpdateDateColumn()
    updatedAt!: Date

    @Order({ priority: 104 })
    @DeleteDateColumn()
    deletedAt!: Date | null
}
