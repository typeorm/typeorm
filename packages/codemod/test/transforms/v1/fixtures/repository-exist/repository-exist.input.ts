import "typeorm"

// No Repository-typed bindings in the file → permissive fallback: any
// `.exist()` receiver gets renamed. This preserves the legacy behavior for
// untyped code that the v0 → v1 codemod has always supported.
const hasUsers = await userRepository.exist({ where: { isActive: true } })
