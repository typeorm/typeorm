import { BaseEntity } from "../../../../../../src/repository/BaseEntity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { CreateDateColumn } from "../../../../../../src/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "../../../../../../src/decorator/columns/UpdateDateColumn"
import { VersionColumn } from "../../../../../../src/decorator/columns/VersionColumn"

/**
 * Mirrors the Alkemio BaseAlkemioEntity: extends TypeORM's BaseEntity
 * (Active Record pattern) with UUID PK, timestamps, and version.
 */
export abstract class BaseAlkemioEntity extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date

    @VersionColumn()
    version: number
}
