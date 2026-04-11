import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class GeometryEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "point", nullable: true })
    point: string | { x: number; y: number } | null

    @Column({ type: "line", nullable: true })
    line: string | null

    @Column({ type: "lseg", nullable: true })
    lseg: string | null

    @Column({ type: "box", nullable: true })
    box: string | null

    @Column({ type: "path", nullable: true })
    path: string | null

    @Column({ type: "polygon", nullable: true })
    polygon: string | null

    @Column({ type: "circle", nullable: true })
    circle: string | { x: number; y: number; radius: number } | null
}
