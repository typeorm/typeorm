import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ValueTransformer } from "typeorm/decorator/options/ValueTransformer"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

class PhonesTransformer implements ValueTransformer {
    to(value: Map<string, number>): string {
        return JSON.stringify([...value])
    }

    from(value: string): Map<string, number> {
        return new Map(JSON.parse(value))
    }
}

@Entity()
export class PhoneBook {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ type: String, transformer: new PhonesTransformer() })
    phones: Map<string, number>
}
