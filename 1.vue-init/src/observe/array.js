let oldArrayPrototype = Array.prototype; // 获取数组 老的原型方法

export let arrayMethods = Object.create(oldArrayPrototype); // 让 arrayMethods 通过__proto__能获取到数组的方法

// arrayMethods.__proto__ = oldArrayPrototype
// arrayMethods.push = function 

let methods = [ // 只有这七个方法 可以导致数组发生变化
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
] 

methods.forEach(method => {
  arrayMethods[method] = function (...args) {
    // 需要调用数组原生的方法
    oldArrayPrototype[method].call(this,...args)

    // 数组新增的属性， 要看一下 是不是对象，如果是对象，继续进行劫持
    // todo 可以添加自己的逻辑 函数劫持 切片编程
    let inserted = null;
    let ob = this.__ob__;
    switch (method) {
      case 'splice':    // 删除 修改 添加 arr.splice(0,0,100,200)
        inserted = args.slice(2); // splice 方法从第三个参数起。是增添的数据
        break;
      case 'push':
      case 'unshift':
        inserted = args; // 调用push 和 unshift 传递的参数就是新增的逻辑
        break;
    }
    // inserted = [] 遍历数组  看一下是否需要进行劫持  
    if(inserted) ob.observeArray(inserted);
  }
})
// 并不会影响 数组原型的方法，只是重写了vue中 data数据中的 数组的原型方法