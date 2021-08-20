import { compileToFunction } from "./compiler";
import { initState } from "./state";

export function initMixin(Vue) {
  // 后续组件化开发时，Vue.extend 可以创建一个子组件，同样可以继承Vue，调用_init方法
  Vue.prototype._init = function (options) {
    const vm = this;

    // 将用户的选项 放在vm上，以便在其他方法中可以获取到options
    vm.$options = options; // 为了后续扩展的方法，都可以获取到options选项

    //统一管理所有的数据 ，data props watch computed 
    initState(vm)

    if (vm.$options.el) {
      // 将数据挂载到页面上
      vm.$mount(vm.$options.el)
    }
  }

  // 模板挂载 new Vue({el}) 等价于 new Vue().$mount(el),因此可以进行方法抽离
  Vue.prototype.$mount = function (el) {
    const vm = this;
    const opts = vm.$options;
    el = document.querySelector(el); // 获取真实的dom元素
    vm.$el = el;
    // 可以有三种方式，编写模板，new Vue({el}), new Vue({template}), new Vue({render})
    // 模板编译优先级 render > template > el
    if(!opts.render){ 
      // 模板编译
      let template = opts.template;
      if(!template){
        template = el.outerHTML
      }
      let render = compileToFunction(template); // 将模板编译成render函数，最终使用的就是render函数
      opts.render = render;
    }
  }
}