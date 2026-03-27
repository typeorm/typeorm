import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"
import { TrimTransformer } from "./TrimTransformer"

export class SaveAddress {
    @Column({ transformer: new TrimTransformer() })
    city: string
}

@Entity()
export class SaveEmbeddedEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    name: string

    @Column(() => SaveAddress)
    address: SaveAddress
}
