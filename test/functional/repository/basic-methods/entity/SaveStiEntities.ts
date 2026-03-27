import {
    ChildEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../../src"
import { TrimTransformer } from "./TrimTransformer"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export abstract class SaveStiBase {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    title: string
}

@ChildEntity()
export class SaveStiPhoto extends SaveStiBase {
    @Column({ transformer: new TrimTransformer() })
    caption: string
}
