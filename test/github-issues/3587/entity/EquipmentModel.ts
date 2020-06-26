import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

export enum EquipmentModelType {
    Thing1 = 1,
    Thing2 = 4,
    Thing3 = 3,
    Thing4 = 2
}

@Entity("equipmentmodels")
export class EquipmentModel {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("enum", {enum: EquipmentModelType})
    type: EquipmentModelType;
}
