import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class GeometryEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "point", nullable: true })
    point: string | object

    @Column({ type: "line", nullable: true })
    line: string | object

    @Column({ type: "lseg", nullable: true })
    lseg: string | object

    @Column({ type: "box", nullable: true })
    box: string | object

    @Column({ type: "path", nullable: true })
    path: string | object

    @Column({ type: "polygon", nullable: true })
    polygon: string | object

    @Column({ type: "circle", nullable: true })
    circle: string | object
}
