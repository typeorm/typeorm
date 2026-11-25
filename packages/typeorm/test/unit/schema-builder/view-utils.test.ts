import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntitySchema } from "../../../src/entity-schema/EntitySchema"
import { EntitySchemaTransformer } from "../../../src/entity-schema/EntitySchemaTransformer"
import { EntityMetadataBuilder } from "../../../src/metadata-builder/EntityMetadataBuilder"
import { ViewUtils } from "../../../src/schema-builder/util/ViewUtils"
import { View } from "../../../src/schema-builder/view/View"

describe("ViewUtils > isMaterializedChanged", () => {
    const expression = `SELECT 1 AS "id"`

    const buildViewMetadata = (materialized: boolean) => {
        const dataSource = new DataSource({ type: "postgres" })
        const metadataArgsStorage = new EntitySchemaTransformer().transform([
            new EntitySchema({
                name: "PostView",
                type: "view",
                expression,
                materialized,
                columns: {
                    id: { type: Number },
                },
            }),
        ])
        const [metadata] = new EntityMetadataBuilder(
            dataSource,
            metadataArgsStorage,
        ).build()
        return metadata
    }

    // Postgres and Oracle set the flag when they load a view, the other drivers leave it unset.
    const buildLoadedView = (materialized?: boolean) => {
        const view = new View()
        view.name = "post_view"
        view.expression = expression
        if (materialized !== undefined) view.materialized = materialized
        return view
    }

    it("should report a regular view that is now materialized", () => {
        expect(
            ViewUtils.isMaterializedChanged(
                buildLoadedView(false),
                buildViewMetadata(true),
            ),
        ).to.equal(true)
    })

    it("should report a materialized view that is now regular", () => {
        expect(
            ViewUtils.isMaterializedChanged(
                buildLoadedView(true),
                buildViewMetadata(false),
            ),
        ).to.equal(true)
    })

    it("should not report a view whose flag did not change", () => {
        expect(
            ViewUtils.isMaterializedChanged(
                buildLoadedView(true),
                buildViewMetadata(true),
            ),
        ).to.equal(false)
        expect(
            ViewUtils.isMaterializedChanged(
                buildLoadedView(false),
                buildViewMetadata(false),
            ),
        ).to.equal(false)
    })

    it("should not report a change when the driver does not set the flag", () => {
        expect(
            ViewUtils.isMaterializedChanged(
                buildLoadedView(),
                buildViewMetadata(true),
            ),
        ).to.equal(false)
        expect(
            ViewUtils.isMaterializedChanged(
                buildLoadedView(),
                buildViewMetadata(false),
            ),
        ).to.equal(false)
    })
})
