import {Entity, PrimaryGeneratedColumn, Column} from "../../../../src/index";

@Entity("cars")
export class Car {
    public static build(item: { wheelsCount: number }) {
        const entity = new Car();
        entity.wheelsCount = item.wheelsCount;

        return entity;
    }

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        comment: "Car wheels count"
    })
    public wheelsCount: number;
}