const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的  aa-xxx
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  aa:aa-xxx  
const startTagOpen = new RegExp(`^<${qnameCapture}`); //  此正则可以匹配到标签名 匹配到结果的第一个(索引第一个) [1]
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>  [1]
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
// [1]属性的key   [3] || [4] ||[5] 属性的值  a=1  a='1'  a=""

const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />    > 
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{   xxx  }}   

export function parserHTML(html) {
  // 不停的截取模板，直到把模板全部解析完毕

  // 构建父子关系  div > p > span 此时考查数据结构？
  // 一般构建父子关系 可以使用栈型数据结构 先进后出  [div, p] 此时p标签的父节点为栈中最后一个节点 div，若标签闭合，从栈中抛出
  let stack = [];
  let root = null;

  function createASTElement(tag, attrs, parent = null) {
    return {
      tag,
      attrs,
      parent,
      children: [],
      type: 1
    }
  }

  function start(tag, attrs) {
    // 遇到开始标签，取栈中最后一个元素作为父节点
    let parent = stack[stack.length - 1];
    let element = createASTElement(tag, attrs, parent);
    if (root == null) { // 根节点
      root = element
    }
    if (parent) {
      element.parent = parent; // 更新当前标签的父节点指向为 stack中最后一个元素 parent
      parent.children.push(element)
    }
    stack.push(element);
  }

  function end(tagName) {
    let endTag = stack.pop();
    if (endTag.tag != tagName) {
      console.error('标签出错！');
    }
  }

  function text(chars) {
    let parent = stack[stack.length - 1];
    chars = chars.replace(/\s/g, '');
    if (chars) {
      parent.children.push({
        text: chars,
        type: 2
      })
    }
  }

  function advance(len) {
    html = html.substring(len)
  }

  function parserStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length);
      // 匹配属性 1要有属性，2不能为开始标签的结束标签  /> > 
      let end;
      let attr;
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[4]
        })
        advance(attr[0].length);
      }
      if (end) {
        advance(end[0].length);
      }
      return match;
    }
    return false;
  }
  while (html) {
    // 解析标签和文本 <
    let index = html.indexOf('<');
    if (index == 0) {
      // 解析开始标签 及属性
      const startTagMatch = parserStartTag()
      if (startTagMatch) { // 开始标签
        // 发射状态？？
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue;
      }
      let endTagMatch;
      if (endTagMatch = html.match(endTag)) { // 结束标签
        end(endTagMatch[1]);
        advance(endTagMatch[0].length)
        continue;
      }
      break;
    }
    // 文本
    if (index > 0) {
      let chars = html.substring(0, index); // 文本区间
      text(chars);
      advance(chars.length)
    }
  }
  return root;
}

// <div id="app">{{message}} <p>hello <span>world</span></p></div>
