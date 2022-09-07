export const batchHelper = {
    batch(items: any[], batchSize?: number) {
        let position = 0
        batchSize = batchSize || 25
        const batches = []
        while (position < items.length) {
            const batch = items.slice(position, position + batchSize)
            batches.push(batch)
            position += batchSize
        }
        return batches
    },
}
