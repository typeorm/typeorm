import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"

export class PostEmbedded {
    @PrimaryColumn()
    secondId: number

    @CreateDateColumn()
    createDate: Date

    @UpdateDateColumn()
    updateDate: Date

    @VersionColumn()
    version: number
}
