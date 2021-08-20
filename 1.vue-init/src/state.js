import { observe } from "./observe";   // rollup-plugin-node-resolve  该插件可以使用node的方式解析文件，查找index文件
import { isFunction } from "./utils";
export function initState(vm) {
  const opts = vm.$options;

  if (opts.data) {
    initData(vm);
  }
}
function proxy(vm, key, source){ // 懒代码，取值的时才去候做代理，而不是把_data 属性赋给vm，而且直接赋值会有命名冲突的问题
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
    proxy(vm, key, '_data') //代理的是vm上的取值和设置值。和vm._dat a 没关系
  }
}