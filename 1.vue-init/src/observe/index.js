import { isArray, isObject } from "../utils";
import { arrayMethods } from "./array";

/**
 * 1. 每个对象都有一个__proto__属性， 它指向所属类的原型 fn.__proto__ = Function.prototype
 * 2. 每个原型上都有一个constructor属性，指向函数本身 Function.prototype.constructor = Function
 */
class Observer{
  constructor(value){
    // 这样写会导致一个问题 死循环，解决： 不让__ob__ 被遍历
    // value.__ob__ = this; // 给对象和数组添加一个自定义属性，(而且value 一定会是对象)

    Object.defineProperty(value,'__ob__',{
      value:this,
      enumerable:false // 标识这个属性是不可枚举的，不会被循环到，默认值就是false
    })
    if(isArray(value)){
      // 更改数组原型方法
      value.__proto__ = arrayMethods;   // 重写数组的方法
      this.observeArray(value);
    }else{
      this.walk(value)  // 核心就是循环对象
    }
  }
  observeArray(data){ // 递归遍历数组，对数组内部的对象 再次重写， [[]],[{}]
    // vm.arr[0].a = 100 响应式
    // vm.arr0[] = 100  非响应式，不可通过索引修改
    data.forEach(item=>observe(item));   // 数组内元素如果是引用类型 那么是响应式的

  }
  walk(data){
    Object.keys(data).forEach(key=>{  // 要使用defineProperty 重新定义
      defineReactive(data,key,data[key])
    })
  }
}

// vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
// 1.性能优化的原则：
// 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
// 2) 不要写数据的时候 层次过深， 尽量扁平化数据 
// 3) 不要频繁获取数据，可以借用中间变量
// 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 

function defineReactive(obj,key,value){    // vue2 慢的原因主要在这个方法中，递归
  observe(value);  // 递归进行观测 不管有多少层，都需要进行defineProperty
  Object.defineProperty(obj,key,{   
    get(){
      return value;    // 形成闭包，会向上层作用域查找value，因此作用域不会销毁
    },
    set(newValue){
      if(value === newValue) return;
      observe(newValue);    // 如果修改以后的值，变为对象，而此时新对象没有被劫持，需要再次进行观测
      console.log('修改');
      value = newValue;
    }
  })
}
export function observe(value) {
  if(!isObject(value)) return;  // 如果 value 不是对象，就不用进行观测

  if(value.__ob__) return;  // 一个对象不需要重新被观测

  // 需要对 对象进行观测，最外层必须是一个对象，不能是数组
  // 如果一个数据已经被观测过了，就不要再进行观测了，用类来实现，观测过的就增加一个标识，在观测时 可以先检测是否观测过，观测过就跳过观测
  return new Observer(value)
}