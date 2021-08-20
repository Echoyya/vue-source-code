import { parserHTML } from "./parser";

export function compileToFunction(template) {
  // 1. 模板编译生成ast语法树
  let ast = parserHTML(template);

  // ?? ?? 代码优化,标记静态节点
  
  // 2. 代码生成render 函数
  generate(ast);




  /**
  难点排序:
    1.编译原理
    2.响应式原理 依赖收集
    3.组件化开发 （贯穿了vue的流程）
    4.diff算法 
   */
}

function generate(ast) {
  
}