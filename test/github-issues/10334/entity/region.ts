import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Region {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    region_name: string

    @Column()
    region_code: string

    @Column({
        nullable: true,
    })
    region_id?: number

    constructor(region_name: string, region_code: string, region_id?: number) {
        this.region_name = region_name;
        this.region_code = region_code;
        this.region_id = region_id;
    }
}
