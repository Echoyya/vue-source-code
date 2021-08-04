import { initState } from "./state";

export function initMixin(Vue) {
  // 后续组件化开发时，Vue.extend 可以好擦UN宫颈癌你一个子组件，同样可以继承Vue，调用_init方法
  Vue.prototype._init = function (options) {
    const vm = this;

    // 将用户的选项 放在vm上，以便在其他方法中可以获取到options
    vm.$options = options; // 为了后续扩展的方法，都可以湖区到options选项

    //统一管理所有的数据 ，data props watch computed
    initState(vm)

    if (vm.$options.el) {
      // 将数据挂载到页面上
      // 此时数据已经被劫持，数据变化需要更新视图，考虑部分节点更新的情况，diff算法更新
      // vue -> template 写起来更符合直觉
      // vue3中的template 写起来性能会更高一些，内部做了很多优化

      // template -> ast 语法树 用来描述语法本身的 -> 描述成一个树结构，将代码重组成js语法
      // 涉及到模板编译原理，把template模板编译成render函数， -> 返回 虚拟dom  -> diff 算法比对虚拟dom

      // ast -> render返回 -> vnode -> 生成真实dom 
      //      更新的时候再次调用render -> 新的vnode  -> 新旧比对 -> 更新真实dom
    }
  }
}