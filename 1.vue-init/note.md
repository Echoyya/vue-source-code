### 使用Rollup搭建开发环境
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

vue 默认支持响应式数据变化  双向绑定
1. 双向绑定：视图变化，影响数据，页面需要支持修改(表单可以改变视图上的数据)，数据变化可以影响视图显示
2. 响应式数据变化：能监控数据变化，并且更新视图 （单向的）

vue 模式 并不是完全遵循mvvm模式，vue 默认只是做视图 ，渐进式 + 组件化 + vue-router + vuex + vue-cli 

数据响应式：Object.defineProperty 将对象中原有的属性 更改成带有get和set的一个对象，当修改该数据是，就会触发set方法，并可以在该方法中 => 更新视图

需要将data变成响应式的 Object.defineProperty 重写data中所有属性，观测对象中的属性

### 源码实现大致流程
1. 实现采用原型模式，所有的功能都通过原型扩展的方式来添加
2. new Vue 会调用_init方法进行初始化操作
3. 会将用户的选项放到 vm.$options上
4. 会对当前属性上搜素有没有data 数据   initState
5. 有data:判断data是不是一个函数 ，如果是函数取返回值作为vm实例的数据源 initData
6. observe 去观测data中的数据 和 vm没关系，此时data已经变成了响应式
7. 判断data是不是一个数组 ，需要可重写改变原数组的7的方法
8. vm上想取值也能取到data中的数据 vm._data = data 这样用户能取到data了
9. 用户觉得有点麻烦 vm.xxx => vm._data代理
10. 数组：递归遍历数组，对数组内部的对象 再次重写 observeArray
11. 对象如果更新对象不存在的属性，会导致视图不更新， 如果是数组更新索引和长度不会触发更新
12. 对象属性set成一个新对象，新对象也需要进行劫持观测，如果是数组存放新内容 push unshift() 新增的内容也会被劫持 通过 __ob__ 进行标识这个对象被监控过 ($set原理) （在vue中被监控的对象身上都有一个__ob__ 这个属性）
13. 如果你就想改索引 可以使用$set方法 内部就是splice()

### vue2 性能优化的原则
vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以耗性能，如果层次过深也会浪费性能
1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
2) 不要写数据的时候 层次过深， 尽量扁平化数据 
3) 不要频繁获取数据，可以借用中间变量
4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 

### 关于数组更新视图的
- 数组也是可以使用defineProperty，但是很少采用arr[868] = 100这种方式去修改数组
- 如果数组也使用了defineProperty，是可以实现修改索引触发更新的，但是效率低。所以源码中没有采用这种方式
- 因此导致的问题就是：数组修改索引不会导致视图的更新，修改length也不会更新
- 正常用户修改数组 无非采用数组的变异方法 push pop shift unshift splice reverse sort 会改变原数组
- 通过重写原型方法，对以上7个方式进行处理，
- 获取数组 老的原型方法,让arrayMethods 通过__proto__能获取到数组的方法
```js
// 1. 每个对象都有一个__proto__属性， 它指向所属类的原型 fn.__proto__ = Function.prototype
// 2. 每个原型上都有一个constructor属性，指向函数本身 Function.prototype.constructor = Function
```
### 什么情况下会更新
- vm.message = {'a':100}
- vm.message.a = 200
- vm.message.b = 300  // vue2 无法劫持到不存在的属性，新增不存在的属性，不会更新视图，但是有方法 $set
- 
- vm.arr[0].name = 'yy';  // 走对象的修改逻辑
- vm.arr[1] = 100; // 如果操作的是数组的索引，那么不会更新视图，因为并没有劫持数组的索引，不能通过更改数组长度和索引(无法监控)
- 数组的7个方法 都会触发更新

### 使用vm.message取值代理的实现
演变过程：
1. vm.$options 中data 是一个函数，在state中处理将用户的data处理之后赋值了局部变量，外部拿不到 
2. vm.$options.data(),重新执行了该函数，返回的新对象，获取到的数据属性并没有被劫持
3. vm._data  可以拿到正确数据，但是还是未能达到预期，
4. defineProperty 做一层代理，达到将数据放在vm上的效果 `vm.message  => vm._data,message`
==state.js==
```js
function proxy(vm, key, source){ // 取值的时候做代理，而不是把_data 属性赋给vm，而且直接赋值会有命名冲突的问题
  Object.defineProperty(vm, key, {
    get(){  // 并不是做了二次响应式，只是做了一层代码，并无其他复杂逻辑
      return vm[source][key]
    },
    set(newValue){
      vm[source][key] = newValue
    }
  })
}

function initData(vm) {
  let data = vm.$options.data; // 用户传入的数据 
  // 如果用户传递的是一个函数，则取函数的返回值作为对象。 如果就是对象就直接使用该对象即可
  // 只有根实例可以 data 是一个对象

  // data 和 vm._data 引用的是同一个空间 -》 data被劫持了  vm._data也被劫持
  data = vm._data = isFunction(data) ? data.call(vm) : data;   // _data 已经是响应式的了

  // 需要将data变成响应式的 Object.defineProperty 重写data中所有属性
  // 响应式 观测数据的入口方法，观测对象中的属性
  observe(data);
  for (let key in data) {   // vm.message  => vm._data,message
    proxy(vm, key, '_data') //代理的是vm上的取值和设置值。和vm._data 没关系
  }
}

```
### 8. 生成ast语法树
- 将数据挂载到页面上，此时数据已经被劫持，数据变化需要更新视图，考虑部分节点更新的情况，diff算法更新
- vue -> template 写起来更符合直觉(vue3中的template 写起来性能会更高一些，内部做了很多优化)
- template -> ast 语法树 用来描述语法本身的 -> 描述成一个树结构，将代码重组成js语法
- 涉及到模板编译原理，把template模板编译成render函数， -> 返回 虚拟dom  -> diff 算法比对虚拟dom
- template编译 -> ast语法生成 -> render返回 -> vnode -> 生成真实dom 
- 更新的时候再次调用render -> 新的vnode  -> 新旧比对 -> 更新真实dom

解析出对应的标签后，需要生成一棵树
### vue3
vue3中支持修改数组的长度及索引去更新视图，vue2中只观测的可以改变原数组的7的方法
支持修改对象中不存在的属性去更新视图，原因是proxy观测的是对象，而不是对象的属性。 