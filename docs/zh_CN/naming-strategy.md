# 命名策略

* 自定义表名称
* 自定义列名称
* 自定义外联列名称
* 自定义多对多联结表名称
* 创建自己的`NamingStrategy`

## 创建自己的`NamingStrategy`

如果在`ormconfig`文件中定义了连接选项，
那么你可以简单地使用它并按照以下方式覆盖它：

```typescript
import {createConnection, getConnectionOptions} from "typeorm";
import {MyNamingStrategy} from "./logger/MyNamingStrategy";

//getConnectionOptions将读取ormconfig文件中的选项并将其返回到connectionOptions对象中，然后你只需向其附加其他属性
getConnectionOptions().then(connectionOptions => {
    return createConnection(Object.assign(connectionOptions, {
        namingStrategy: new MyNamingStrategy()
    }))
});
```

命名策略是一个需要改变的主题。
一旦API稳定下来，就会获得详细的文档。
