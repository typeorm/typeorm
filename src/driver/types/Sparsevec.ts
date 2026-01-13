/**
 * Represents a sparse vector for PostgreSQL's pgvector extension.
 * Sparse vectors store only non-zero values with their indices.
 * Indices start at 1 like SQL arrays.
 * @see https://github.com/pgvector/pgvector?tab=readme-ov-file#sparse-vectors
 *
 * Format: `{index:value,index:value,...}/dimensions`
 *
 * Example: `{1:1.5,5:2.3,10:3.7}/20`
 */
export class Sparsevec {
    /**
     * The dimension/length of the sparse vector
     */
    dimensions?: number | undefined = undefined

    /**
     * Map of index to value for non-zero elements
     */
    elements: Map<number, number>

    /**
     * @param {number | Map<number, number> | Record<number, number>} dimensionsOrElements
     * @param {Map<number, number> | Record<number, number>} [elements]
     */
    constructor(
        dimensionsOrElements:
            | number
            | Map<number, number>
            | Record<number, number>,
        elements?: Map<number, number> | Record<number, number>,
    ) {
        if (typeof dimensionsOrElements === "number") {
            this.dimensions = dimensionsOrElements
            if (elements instanceof Map) {
                this.elements = elements
            } else if (elements) {
                this.elements = new Map(
                    Object.entries(elements).map(([k, v]) => [Number(k), v]),
                )
            } else {
                this.elements = new Map()
            }
        } else {
            if (dimensionsOrElements instanceof Map) {
                this.elements = dimensionsOrElements
            } else {
                this.elements = new Map(
                    Object.entries(dimensionsOrElements).map(([k, v]) => [
                        Number(k),
                        v,
                    ]),
                )
            }
        }
    }

    /**
     * Create a Sparsevec from a dense array
     * @param {number[]} array - A dense array
     * @param {number} [dimensions] - Optional dimensions (if different from array length)
     * @returns {Sparsevec}
     */
    static fromDense(array: number[], dimensions?: number): Sparsevec {
        const elements = new Map<number, number>()
        array.forEach((value, index) => {
            if (value !== 0) {
                elements.set(index + 1, value)
            }
        })
        return new Sparsevec(dimensions ?? array.length, elements)
    }

    /**
     * Create a Sparsevec from the PostgreSQL string format
     * @param {string} str - The string representation `{index:value,index:value,...}/dimensions`
     * @returns {Sparsevec}
     */
    static fromString(str: string): Sparsevec {
        const match = str.match(/^\{([^}]*)\}\/(\d+)$/)
        if (!match) {
            throw new Error(`Invalid sparsevec format: ${str}`)
        }

        const [, elementStr, dimensionsStr] = match
        const dimensions = parseInt(dimensionsStr, 10)
        const elements = new Map<number, number>()

        if (elementStr) {
            const pairs = elementStr.split(",")
            for (const pair of pairs) {
                const [indexStr, valueStr] = pair.split(":")
                const index = parseInt(indexStr, 10)
                const value = parseFloat(valueStr)
                elements.set(index, value)
            }
        }

        return new Sparsevec(dimensions, elements)
    }

    /**
     * Convert to PostgreSQL string format
     *
     * Format: `{index:value,index:value,...}/dimensions`
     * @returns {string}
     */
    toString(): string {
        const pairs: string[] = []
        const sortedIndices = Array.from(this.elements.keys()).sort(
            (a, b) => a - b,
        )
        for (const index of sortedIndices) {
            const value = this.elements.get(index)!
            pairs.push(`${index}:${value}`)
        }
        return `{${pairs.join(",")}}/${this.dimensions}`
    }

    /**
     * Convert to dense array representation
     * @returns {number[]}
     */
    toDense(): number[] {
        this.dimensions = this.dimensions ?? 0
        const array = new Array(this.dimensions).fill(0)
        this.elements.forEach((value, index) => {
            if (index >= 1 && index <= this.dimensions!) {
                array[index - 1] = value
            }
        })
        return array
    }

    /**
     * Get the value at a specific index (1-based indexing)
     * @param {number} index
     * @returns {number}
     */
    get(index: number): number {
        return this.elements.get(index) ?? 0
    }

    /**
     * Set the value at a specific index (1-based indexing)
     * @param {number} index
     * @param {number} value
     * @returns {void}
     */
    set(index: number, value: number): void {
        if (index < 1 || index > this.dimensions!) {
            throw new Error(
                `Index ${index} out of bounds for dimensions ${this.dimensions} (1-based indexing)`,
            )
        }
        if (value === 0) {
            this.elements.delete(index)
        } else {
            this.elements.set(index, value)
        }
    }

    /**
     * Get the number of non-zero elements
     * @returns {number}
     */
    get nnz(): number {
        return this.elements.size
    }
}
