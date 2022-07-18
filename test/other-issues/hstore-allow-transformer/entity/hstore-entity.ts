import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { testTransformer } from "../test-transformer"

@Entity()
export class DummyHSTOREEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "hstore", transformer: testTransformer })
    translation: object
}
