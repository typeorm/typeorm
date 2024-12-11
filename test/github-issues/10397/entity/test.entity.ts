import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

export interface Pair {
    key: string
    value: string
}

export class PairTransformer {
    to(value: Pair[]): string[] {
        return value.map(pair => `${pair.key}:${pair.value}`)
    }

    from(value: string[]): Pair[] {
        return value.map(pair => {
            const [key, value] = pair.split(":")
            return { key, value }
        })
    }
}


@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar", array: true, default: [], transformer: new PairTransformer()})
    pairs: Pair[]
}
