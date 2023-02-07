import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../src/decorator/relations/JoinColumn"
import { Column } from "../../../../src/decorator/columns/Column"
import { Device } from "./Device"

@Entity("device_instances")
export class DeviceInstance {
    @PrimaryColumn({ name: "id", type: "char", length: "36" })
    id: string

    @ManyToOne((type) => Device, { nullable: false })
    @JoinColumn({ name: "device_id", referencedColumnName: "id" })
    device: Device

    @Column({ name: "instance", type: "smallint" })
    instance: number

    @Column({ name: "type", type: "varchar", length: "30" })
    type: string
}
