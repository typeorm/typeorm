// Real-world NestJS pattern: service file that doesn't import from typeorm
// directly (the DataSource is injected through a wrapper service). The
// transform still rewrites `select: [...]` inside `.find*()` calls because
// the call-site shape is the scope gate, not a file-level typeorm import.
class ConfigService {
    constructor(
        private readonly tenantConnectionService: TenantConnectionService,
    ) {}

    async loadTags() {
        const tagRepository =
            this.tenantConnectionService.getRepository(TagEntity)
        return tagRepository.find({
            select: {
                id: true,
                name: true,
            },
        })
    }

    async loadFiles() {
        // `entityManager.find(Entity, { select: [...] })` — the string-array
        // is the second argument's property, still inside a find() call.
        return entitySandbox.entityManager.find(JouleChatFileEntity, {
            select: {
                guid: true,
                runtimeTableName: true,
                storageMode: true,
            },
        })
    }

    // Non-find call must NOT be touched — the transform is scoped to
    // typeorm find-method arguments.
    buildReport() {
        return reportBuilder.render({ select: ["kind", "total"] })
    }
}
