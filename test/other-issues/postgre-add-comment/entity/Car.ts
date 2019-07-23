import {Entity, PrimaryGeneratedColumn, Column} from "../../../../src/index";

@Entity("cars")
export class Car {
    @PrimaryGeneratedColumn({
        name: "id",
        comment: "Row index"
    })
    public id: number;

    @Column({
        name: "wheelscount",
        comment: "Car wheels count"
    })
    public wheelsCount: number;
}