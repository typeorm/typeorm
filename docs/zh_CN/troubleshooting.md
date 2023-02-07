# 故障排除

* [全球模式](#全球模式)

## 全球模式

在类型中使用全局模式来指定实体，迁移，订户和其他信息的位置。模式中的错误可能导致常见的`RepositoryNotFoundError`和熟悉的错误。为了检查TypeOrm是否使用glob模式加载了任何文件，您需要做的就是将日志级别设置为`info`，如文档的[Logging](./logging.md)部分所述。 这将允许您拥有可能如下所示的日志：

```bash
# 如果出错
 INFO: No classes were found using the provided glob pattern:  "dist/**/*.entity{.ts}"
```
```bash
# 何时找到文件
INFO: All classes found using provided glob pattern "dist/**/*.entity{.js,.ts}" : "dist/app/user/user.entity.js | dist/app/common/common.entity.js"
```