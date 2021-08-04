## 使用Rollup搭建开发环境
Rollup是一个JS模块打包器，可以将小块代码编译成大块负责的代码，rollup.js更专注于JS类库打包(开发应用时使用webpack,开发库时使用Rollup) 
安装rollup环境
**`npm install rollup @babel/core rollup-plugin-babel @babel/preset-env -D`**
==rollup.config.js:==rollup 配置文件
```js
import babel from 'rollup-plugin-babel'
export default {
  input: './src/index.js', // 打包的入口
  output: {
    file: 'dist/vue.js', // 打包的出口
    format: 'umd', // 常见的格式 IIFE ESM CJS UMD
    name: 'Vue', // umd模块需要配置name,会将导出的模块放在window上，如果在node中使用cjs，如果只是打包webpack里面导入esm模块，前端里script iife umd
    sourcemap: true, // 源码映射， 可以进行源代码调试
  },
  plugins: [
    babel({
      exclude: 'node_modules/**' // glob 写法，去掉node_modules下的所有文件夹的文件
    })
  ]
}
```

配置执行脚本: -c --config  -w --watch
```json
  "scripts": {
    "dev": "rollup -c -w"
  },
```

通过入口打包，传入用户配置的参数，并且内部会进行初始化，初始化的时候会将vue的构造函数传进来，并扩展一个原型方法，参数是用户输入的参数，扩展options参数在后续其他方法中也可以使用，

在考虑数据的初始化，initState方法，统一处理用户传入的所有数据类型 data props watch computed
初始化数据之后，在判断有无el，有的话需要将数据挂载到页面中

1. new Vue 会调用_init方法进行初始化操作
2. 会将用户的选项放到 vm.$options上
3. 会对当前属性上搜素有没有data 数据   initState
4. 有data 判断data是不是一个函数 ，如果是函数取返回值 initData
5. observe 去观测data中的数据 和 vm没关系，说明data已经变成了响应式
6. vm上像取值也能取到data中的数据 vm._data = data 这样用户能取到data了  vm._data
7. 用户觉得有点麻烦 vm.xxx => vm._data
8. 如果更新对象不存在的属性，会导致视图不更新， 如果是数组更新索引和长度不会触发更新
9. 如果是替换成一个新对象，新对象会被进行劫持，如果是数组存放新内容 push unshift() 新增的内容也会被劫持 通过 __ob__ 进行标识这个对象被监控过 ($set原理) （在vue中被监控的对象身上都有一个__ob__ 这个属性）
10. 如果你就想改索引 可以使用$set方法 内部就是splice()


vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以耗性能，如果层次过深也会浪费性能
1.性能优化的原则：
1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
2) 不要写数据的时候 层次过深， 尽量扁平化数据 
3) 不要频繁获取数据，可以借用中间变量
4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 