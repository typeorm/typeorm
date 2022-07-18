import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Kollektion } from "./Kollektion"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Generated } from "typeorm/decorator/Generated"

@Entity("artikel")
export class Artikel {
    @PrimaryColumn({ name: "artikel_id" })
    @Generated()
    id: number

    @Column({ name: "artikel_nummer" })
    nummer: string

    @Column({ name: "artikel_name" })
    name: string

    @Column({ name: "artikel_extrabarcode" })
    extrabarcode: string

    @Column({ name: "artikel_saison" })
    saison: string

    @ManyToOne((type) => Kollektion, { cascade: true })
    @JoinColumn({ name: "id_kollektion" })
    kollektion: Kollektion
}
