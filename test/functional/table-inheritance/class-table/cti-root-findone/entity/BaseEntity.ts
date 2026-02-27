import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { CreateDateColumn } from "../../../../../../src/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "../../../../../../src/decorator/columns/UpdateDateColumn"
import { VersionColumn } from "../../../../../../src/decorator/columns/VersionColumn"

/**
 * Abstract base entity with UUID PK, timestamps, and version column.
 * Mirrors BaseAlkemioEntity from the app.
 */
export abstract class BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date

    @VersionColumn()
    version: number
}
