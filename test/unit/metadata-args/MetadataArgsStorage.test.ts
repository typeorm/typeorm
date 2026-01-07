import "reflect-metadata"
import { expect } from "chai"
import { MetadataArgsStorage } from "../../../src/metadata-args/MetadataArgsStorage"

describe("MetadataArgsStorage", () => {
    describe("filterIndices", () => {
        it("should filter out duplicate indices with the same name", () => {
            const storage = new MetadataArgsStorage()

            // Add duplicate indices with the same name
            storage.indices.push({
                target: "Person",
                name: "IDX_TEST",
                columns: ["firstName", "lastName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                name: "IDX_TEST",
                columns: ["firstName", "lastName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                name: "IDX_TEST",
                columns: ["firstName", "lastName"],
                unique: false,
            })

            const filtered = storage.filterIndices("Person")

            // Should only return one index, not three
            expect(filtered.length).to.be.equal(1)
            expect(filtered[0].name).to.be.equal("IDX_TEST")
        })

        it("should filter out duplicate indices without name but same columns and properties", () => {
            const storage = new MetadataArgsStorage()

            // Add duplicate indices without names but same columns
            storage.indices.push({
                target: "Person",
                columns: ["firstName", "lastName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                columns: ["firstName", "lastName"],
                unique: false,
            })

            const filtered = storage.filterIndices("Person")

            // Should only return one index
            expect(filtered.length).to.be.equal(1)
        })

        it("should keep indices with different names", () => {
            const storage = new MetadataArgsStorage()

            storage.indices.push({
                target: "Person",
                name: "IDX_FIRST_NAME",
                columns: ["firstName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                name: "IDX_LAST_NAME",
                columns: ["lastName"],
                unique: false,
            })

            const filtered = storage.filterIndices("Person")

            // Should return both indices
            expect(filtered.length).to.be.equal(2)
        })

        it("should keep indices with different columns", () => {
            const storage = new MetadataArgsStorage()

            storage.indices.push({
                target: "Person",
                columns: ["firstName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                columns: ["lastName"],
                unique: false,
            })

            const filtered = storage.filterIndices("Person")

            // Should return both indices
            expect(filtered.length).to.be.equal(2)
        })

        it("should keep indices with different properties (unique)", () => {
            const storage = new MetadataArgsStorage()

            storage.indices.push({
                target: "Person",
                columns: ["firstName", "lastName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                columns: ["firstName", "lastName"],
                unique: true,
            })

            const filtered = storage.filterIndices("Person")

            // Should return both indices (different unique property)
            expect(filtered.length).to.be.equal(2)
        })

        it("should filter indices for multiple targets correctly", () => {
            const storage = new MetadataArgsStorage()

            // Add indices for Person
            storage.indices.push({
                target: "Person",
                name: "IDX_PERSON",
                columns: ["firstName"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                name: "IDX_PERSON",
                columns: ["firstName"],
                unique: false,
            })

            // Add indices for Company
            storage.indices.push({
                target: "Company",
                name: "IDX_COMPANY",
                columns: ["name"],
                unique: false,
            })

            const filteredPerson = storage.filterIndices("Person")
            const filteredCompany = storage.filterIndices("Company")

            // Should return deduplicated indices for each target
            expect(filteredPerson.length).to.be.equal(1)
            expect(filteredPerson[0].name).to.be.equal("IDX_PERSON")

            expect(filteredCompany.length).to.be.equal(1)
            expect(filteredCompany[0].name).to.be.equal("IDX_COMPANY")
        })

        it("should handle array of targets correctly", () => {
            const storage = new MetadataArgsStorage()

            // Simulate inheritance scenario
            storage.indices.push({
                target: "BaseEntity",
                name: "IDX_BASE",
                columns: ["id"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                name: "IDX_BASE",
                columns: ["id"],
                unique: false,
            })

            storage.indices.push({
                target: "Person",
                name: "IDX_PERSON",
                columns: ["firstName"],
                unique: false,
            })

            const filtered = storage.filterIndices(["BaseEntity", "Person"])

            // Should deduplicate indices with the same name across inheritance
            expect(filtered.length).to.be.equal(2)

            const indexNames = filtered.map((idx) => idx.name).sort()
            expect(indexNames).to.deep.equal(["IDX_BASE", "IDX_PERSON"])
        })
    })
})
