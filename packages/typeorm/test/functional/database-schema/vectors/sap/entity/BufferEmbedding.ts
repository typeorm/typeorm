import {
    Column,
    Entity,
    PrimaryColumn,
    ValueTransformer,
} from "../../../../../../src"

const vectorTransformer: ValueTransformer = {
    to: (value: number[]) => {
        const length = value.length
        const arrayBuffer = new ArrayBuffer(4 + length * 4)
        const dataView = new DataView(arrayBuffer)

        dataView.setUint32(0, length, true)
        for (let index = 0; index < length; index++) {
            dataView.setFloat32(4 + index * 4, value[index], true)
        }

        return Buffer.from(arrayBuffer)
    },
    from: (value: Buffer) => {
        const dataView = new DataView(
            value.buffer,
            value.byteOffset,
            value.byteLength,
        )
        const length = dataView.getUint32(0, true)
        const array = new Array<number>(length)
        for (let index = 0; index < length; index++) {
            array[index] = dataView.getFloat32(4 + index * 4, true)
        }

        return array
    },
}

@Entity()
export class BufferEmbedding {
    @PrimaryColumn()
    id: number

    @Column("nclob")
    content: string

    @Column("nclob")
    metadata: string

    @Column("real_vector", {
        transformer: vectorTransformer,
    })
    realVector: number[]
}
