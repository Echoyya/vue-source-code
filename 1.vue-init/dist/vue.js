(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function isFunction(val) {
    return typeof val === 'function';
  }
  function isObject(val) {
    return typeof val === 'object' && val !== null;
  }
  let isArray = Array.isArray;

  let oldArrayPrototype = Array.prototype; // 获取数组 老的原型方法

  let arrayMethods = Object.create(oldArrayPrototype); // 让arrayMethods 通过__proto__能获取到数组的方法
  // arrayMethods.__proto__ = oldArrayPrototype
  // arrayMethods.push = function 

  let methods = [// 只有这七个方法 可以导致数组发生变化
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
  methods.forEach(method => {
    arrayMethods[method] = function (...args) {
      // 需要调用数组原生的方法
      oldArrayPrototype[method].call(this, ...args); // 数组新增的属性， 要看一下 是不是对象，如果是对象，继续进行劫持
      // todo 可以添加自己的逻辑 函数劫持 切片编程

      let inserted = null;
      let ob = this.__ob__;

      switch (method) {
        case 'splice':
          // 删除 修改 添加 arr.splice(0,0,100,200)
          inserted = args.slice(2); // splice 方法从第三个参数起。是增添的数据

          break;

        case 'push':
        case 'unshift':
          inserted = args; // 调用push 和 unshift 传递的参数就是新增的逻辑

          break;
      } // inserted = [] 遍历数组  看一下是否需要进行劫持  


      if (inserted) ob.observeArray(inserted);
    };
  }); // 并不会影响 数组原型的方法，只是重写了vue中 data数据中的 数组的原型方法

  /**
   * 1. 每个对象都有一个__proto__属性， 它指向所属类的原型 fn.__proto__ = Function.prototype
   * 2. 每个原型上都有一个constructor属性，指向函数本身 Function.prototype.constructor = Function
   */

  class Observer {
    constructor(value) {
      // 这样写会导致一个问题 死循环，解决： 不让__ob__ 被遍历
      // value.__ob__ = this; // 给对象和数组添加一个自定义属性，(而且value 一定会是对象)
      Object.defineProperty(value, '__ob__', {
        value: this,
        enumerable: false // 标识这个属性是不可枚举的，不会被循环到，默认值就是false

      });

      if (isArray(value)) {
        // 更改数组原型方法
        value.__proto__ = arrayMethods; // 重写数组的方法

        this.observeArray(value);
      } else {
        this.walk(value); // 核心就是循环对象
      }
    }

    observeArray(data) {
      // 递归遍历数组，对数组内部的对象 再次重写， [[]],[{}]
      // vm.arr[0].a = 100 响应式
      // vm.arr0[] = 100  非响应式，不可通过索引修改
      data.forEach(item => observe(item)); // 数组内元素如果是引用类型 那么是响应式的
    }

    walk(data) {
      Object.keys(data).forEach(key => {
        // 要使用defineProperty 重新定义
        defineReactive(data, key, data[key]);
      });
    }

  } // vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
  // 1.性能优化的原则：
  // 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
  // 2) 不要写数据的时候 层次过深， 尽量扁平化数据 
  // 3) 不要频繁获取数据，可以借用中间变量
  // 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 


  function defineReactive(obj, key, value) {
    // vue2 慢的原因主要在这个方法中，递归
    observe(value); // 递归进行观测

    Object.defineProperty(obj, key, {
      get() {
        return value; // 形成闭包，会向上层作用域查找value，因此作用域不会销毁
      },

      set(newValue) {
        if (value === newValue) return;
        observe(newValue); // 如果修改以后的值，变为对象，而此时新对象没有被劫持，需要再次进行观测

        console.log('修改');
        value = newValue;
      }

    });
  }

  function observe(value) {
    if (!isObject(value)) return; // 如果 value 不是对象，就不用进行观测

    if (value.__ob__) return; // 一个对象不需要重新被观测
    // 需要对 对象进行观测，最外层必须是一个对象，不能是数组
    // 如果一个数据已经被观测过了，就不要再进行观测了，用类来实现，观测过的就增加一个标识，在观测时 可以先检测是否观测过，观测过就跳过观测

    return new Observer(value);
  }

  function initState(vm) {
    const opts = vm.$options;

    if (opts.data) {
      initData(vm);
    }
  }

  function proxy(vm, key, source) {
    // 取值的时候做代理，而不是把_data 属性赋给vm，而且直接赋值会有命名冲突的问题
    Object.defineProperty(vm, key, {
      get() {
        return vm[source][key];
      },

      set(newValue) {
        vm[source][key] = newValue;
      }

    });
  }

  function initData(vm) {
    let data = vm.$options.data; // 用户传入的数据 
    // 如果用户传递的是一个函数，则取函数的返回值作为对象。 如果就是对象就直接使用该对象即可
    // 只有根实例可以 data 是一个对象
    // data 和 vm._data 引用的是同一个空间 -》 data被劫持了  vm._data也被劫持

    data = vm._data = isFunction(data) ? data.call(vm) : data; // _data 已经是响应式的了
    // 需要将data变成响应式的 Object.defineProperty
    // 响应式 观测数据的入口方法，观测对象中的属性

    observe(data);

    for (let key in data) {
      // vm.message  => vm._data,message
      proxy(vm, key, '_data'); //代理的是vm上的取值和设置值。和vm._data 没关系
    }
  }

  function initMixin(Vue) {
    // 后续组件化开发时，Vue.extend 可以好擦UN宫颈癌你一个子组件，同样可以继承Vue，调用_init方法
    Vue.prototype._init = function (options) {
      const vm = this; // 将用户的选项 放在vm上，以便在其他方法中可以获取到options

      vm.$options = options; // 为了后续扩展的方法，都可以湖区到options选项
      //统一管理所有的数据 ，data props watch computed

      initState(vm);

      if (vm.$options.el) {
        console.log('页面要挂载');
      }
    };
  }

  function Vue(options) {
    this._init(options); // vue 初始化功能

  }

  initMixin(Vue); // 导出Vue
  // 2.会将用户的选项放到 vm.$options上
  // 3.会对当前属性上搜素有没有data 数据   initState
  // 4.有data 判断data是不是一个函数 ，如果是函数取返回值 initData
  // 5.observe 去观测data中的数据 和 vm没关系，说明data已经变成了响应式
  // 6.vm上想取值也能取到data中的数据 vm._data = data 这样用户能取到data了  vm._data
  // 7.用户觉得有点麻烦 vm.xxx => vm._data
  // 8.如果更新对象不存在的属性，会导致视图不更新， 如果是数组更新索引和长度不会触发更新
  // 9.如果是替换成一个新对象，新对象会被进行劫持，如果是数组存放新内容 push unshift() 新增的内容也会被劫持
  // 通过__ob__ 进行标识这个对象被监控过  （在vue中被监控的对象身上都有一个__ob__ 这个属性）
  // 10如果你就想改索引 可以使用$set方法 内部就是splice()

  return Vue;

})));
//# sourceMappingURL=vue.js.map
