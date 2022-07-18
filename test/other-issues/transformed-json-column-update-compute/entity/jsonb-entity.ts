import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { VersionColumn } from "typeorm"
import { testTransformer } from "../test-transformer"

@Entity()
export class DummyJSONBEntity {
    @PrimaryGeneratedColumn()
    id: number

    @VersionColumn()
    version: number

    @Column({ type: "jsonb", transformer: testTransformer })
    value: Record<string, any>
}
