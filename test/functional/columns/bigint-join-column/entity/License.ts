import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../src"
import { Product } from "./Product"

@Entity("licenses_bigint_jc")
export class License {
    @PrimaryColumn("bigint", { name: "id" })
    id: string

    @Column("bigint", { name: "product_id", nullable: true })
    productId: string | null

    @ManyToOne(() => Product, (product) => product.licenses)
    @JoinColumn([{ name: "product_id", referencedColumnName: "id" }])
    product: Product
}
