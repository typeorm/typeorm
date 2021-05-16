import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity("devices")
export class Device {

    @PrimaryColumn({
        name: "id",
        type: "char",
        length: "12"
    })
    id: string;

    @Column({
        name: "registration_token",
        type: "decimal",
        precision: 6,
        scale: 0
    })
    registrationToken: string;

}