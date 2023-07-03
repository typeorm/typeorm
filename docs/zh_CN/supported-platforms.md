# 支持的平台

  * [NodeJS](#nodejs)
  * [Browser](#browser)
  * [Cordova/PhoneGap/Ionic apps](#cordova--phonegap--ionic-apps)
  * [React Native](#react-native)
  * [Expo](#expo)
  * [NativeScript](#nativescript)

## NodeJS

TypeORM 在 Node.js 版本 4 及更高版本上进行了测试。

## Browser

你可以在浏览器中使用[sql.js](https://github.com/kripken/sql.js)。

**Webpack 配置**

在`browser`文件夹中，该软件包还包括一个编译为 ES2015 模块的版本。 如果你想使用不同的加载器，可以使用该版本。 在 TypeORM 0.1.7 之前，软件包的设置方式使得像 webpack 这样的加载器会自动使用`browser`文件夹。 在 0.1.7 版本中，该设置被删除以支持 Node.js 项目中的 Webpack 使用。 这意味着你必须使用`NormalModuleReplacementPlugin`来确保为浏览器项目加载正确的版本。 对于此插件在 webpack 配置文件中的配置，如下所示：

```js
plugins: [
    ..., // 已有的任何现有插件
    new webpack.NormalModuleReplacementPlugin(/typeorm$/, function (result) {
        result.request = result.request.replace(/typeorm/, "typeorm/browser");
    }),
    new webpack.ProvidePlugin({
      'window.SQL': 'sql.js/js/sql.js'
    })
]
```

**配置示例**

```typescript
createConnection({
  type: "sqljs",
  entities: [Photo],
  synchronize: true
});
```

**不要忘记引入 reflect-metadata**

在主 html 页面中，你需要引入 reflect-metadata：

```html
<script src="./node_modules/reflect-metadata/Reflect.js"></script>
```

## Cordova / PhoneGap / Ionic apps

TypeORM 能够使用[cordova-sqlite-storage](https://github.com/litehelpers/Cordova-sqlite-storage)插件在 Cordova、PhoneGap、Ionic 应用程序上运行，你可以选择在浏览器包中选择模块加载器。
有关如何在 Cordova 中使用 TypeORM 的示例，请参阅[typeorm/cordova-example](https://github.com/typeorm/cordova-example)，对于 Ionic，请参阅[typeorm/ionic-example](https://github.com/typeorm/ionic-example)
**重要**：要与 Ionic 一起使用，需要自定义 webpack 配置文件！ 请查看示例以参考所需的更改。

## React Native

TypeORM 可以使用[react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage)插件在 React Native 应用程序上运行。 有关示例，请参阅[typeom/react-native-example](https://github.com/typeorm/react-native-example)。

## Expo

TypeORM 可以使用[Expo SQLite API](https://docs.expo.io/versions/latest/sdk/sqlite.html)在 Expo 应用程序上运行。 有关如何在 Expo 中使用 TypeORM 的示例，请参阅[typeorm/react-native-example](https://github.com/typeorm/react-native-example)。

## NativeScript

1. `tns install webpack` (请阅读下面为什么需要 webpack)
2. `tns plugin add nativescript-sqlite`

注意：这仅适用于 NativeScript 4.x 及更高版本

_当使用 NativeScript 时，**使用 webpack 是强制性的**。
`typeorm/browser`包是带有`import/export`的原始 ES7 代码
这将**不会**按原样运行，必须要打包。
请使用`tns run --bundle`方法_

Checkout [示例](https://github.com/championswimmer/nativescript-vue-typeorm-sample)!
