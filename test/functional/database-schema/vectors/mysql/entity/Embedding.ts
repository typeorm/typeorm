import {
    Column,
    Entity,
    PrimaryColumn,
    ValueTransformer,
} from "../../../../../../src"

/*
 * The mysql2 client partially supports the vector type. Newer versions support
 * only deserializing from binary format. Currently mysql2 only accepts binary
 * parameters for vector values, and not numeric arrays.
 */
const vectorTransformer: ValueTransformer = {
    to: (value: number[]) => {
        const length = value.length
        const arrayBuffer = new ArrayBuffer(length * 4)
        const dataView = new DataView(arrayBuffer)

        for (let index = 0; index < length; index++) {
            dataView.setFloat32(index * 4, value[index], true)
        }

        return Buffer.from(arrayBuffer)
    },
    from: (value: Buffer | number[]) => {
        if (Array.isArray(value)) {
            // newer versions of mysql2 already deserialize vector as number[]
            return value
        }
        const dataView = new DataView(
            value.buffer,
            value.byteOffset,
            value.byteLength,
        )
        const length = value.byteLength / 4
        const array = new Array<number>(length)
        for (let index = 0; index < length; index++) {
            array[index] = dataView.getFloat32(index * 4, true)
        }

        return array
    },
}

@Entity()
export class Embedding {
    @PrimaryColumn()
    id: number

    @Column()
    content: string

    @Column()
    metadata: string

    @Column("vector", {
        length: 16,
        transformer: vectorTransformer,
    })
    vector: number[]
}
