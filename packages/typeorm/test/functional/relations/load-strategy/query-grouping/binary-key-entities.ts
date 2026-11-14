import type { ColumnType } from "../../../../../src"
import { EntitySchema } from "../../../../../src"

export interface Device {
    serial: Uint8Array
    name: string
    readings: Reading[]
}

export interface Reading {
    id: number
    label: string
    device: Device | null
}

export const createBinaryKeyEntities = (binaryType: ColumnType) => [
    new EntitySchema<Device>({
        name: "Device",
        columns: {
            serial: { type: binaryType, primary: true },
            name: { type: String },
        },
        relations: {
            readings: {
                type: "one-to-many",
                target: "Reading",
                inverseSide: "device",
            },
        },
    }),
    new EntitySchema<Reading>({
        name: "Reading",
        columns: {
            id: { type: Number, primary: true, generated: "increment" },
            label: { type: String },
        },
        relations: {
            device: {
                type: "many-to-one",
                target: "Device",
                inverseSide: "readings",
                joinColumn: true,
                nullable: true,
            },
        },
    }),
]
