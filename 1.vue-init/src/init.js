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
      console.log('页面要挂载');
    }
  }
}