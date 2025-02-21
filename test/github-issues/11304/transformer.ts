export const ID_TRANSFORMER = {
    from: (dbValue: number) => dbValue?.toString(),
    to: (entityValue: string) =>
        entityValue ? Number(entityValue) : entityValue,
}
