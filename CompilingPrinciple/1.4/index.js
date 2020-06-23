((window, undefined) => {
  // 树的配置
  // https://fperucic.github.io/treant-js/
  const TreeConfig = {
    chart: {
      container: '#tree-container', // 挂载节点
      scrollbar: 'fancy',
      levelSeparation: 15,
      subTeeSeparation: 10,
      connectors: {
        type: 'bCurve',
      },
    },
    nodeStructure: {},
  };

  const getRegExpReversePolishExpression = input => {
    // 维护一个终结符队列
    const alphaQueue = [];
    // 维护一个操作符栈
    const operatorStack = [];

    // 维护一个 flag，判断是否是并集运算
    let unionFlag = false;

    // 维护一个 flag，如果出现开头就是 ( 的情况，则在处理完 ) 后不需要进行并集操作
    let firstSemi = true;

    // 遍历输入数据
    input.split('').forEach((v, index) => {
      if (v === '(' || v === '|') {
        // 普通运算符，直接可以入栈
        unionFlag = false; // 不是连续出现的终结符组合
        operatorStack.push(v);
        if (firstSemi && v === '(' && Boolean(alphaQueue.length)) {
          firstSemi = false;
        }
        return;
      }
      if (v === '*') {
        // 上一个是 *，下一个如果是终结符，那么一定是并运算
        unionFlag = true;
        alphaQueue.push(v); // 闭包需要直接运用在式子中
        return;
      }
      if (v === ')') {
        // 右括号需要连续出栈
        while (operatorStack[operatorStack.length - 1] !== '(') {
          alphaQueue.push(operatorStack.pop());
          if (!operatorStack.length) {
            throw new Error(`对于 ${index} 个右括号，没有与其对应的左括号！`);
          }
        }
        operatorStack.pop(); // 弹出 (
        if (!firstSemi && !operatorStack.length) {
          // 在加入刚刚弹出的 ( 之前，在 alphaQueue 中已经有元素了
          // 并且当前符号栈顶不是任何一个操作符时，需要立即增加一个 cat
          alphaQueue.push('.');
        }
        unionFlag = true; // 如果下一个输入的是符号，则需要 cat
        return;
      }
      // 终结符组合
      alphaQueue.push(v);
      if (unionFlag) {
        // 当前的终结符相对于上一个组合是并运算
        alphaQueue.push('.');
      }
      unionFlag = true; // 下一个如果是终结符，一定是并运算
    });

    // 出操作符栈，直至栈空
    while (operatorStack.length) {
      alphaQueue.push(operatorStack.pop());
    }

    return alphaQueue.join('');
  };

  const makeTree = value => {
    // 根据后缀表达式生成一颗抽象语法树

    // 维护一个栈
    // { text: string; children: Array<self> }
    // children[0] 永远为左子树
    // children[1] 永远为右子树
    const stack = [];

    value.split('').forEach(v => {
      if (v !== '*' && v !== '.' && v !== '|') {
        // 不是运算符，直接入栈
        stack.push({ text: v, children: [] });
        return;
      }

      // 如果是 * 单目运算符，出栈一个就好
      if (v === '*') {
        const virtualRoot = stack.pop();
        stack.push({
          text: v,
          children: [virtualRoot],
        });
        return;
      }

      // 是运算符，出栈两个元素
      const virtualRoot = stack.pop();
      const leftJoinTree = stack.pop();

      // 拿到 virtualRoot 的最左子树
      let minLeftChildInVirtualRoot = virtualRoot.children[0];
      do {
        if (!minLeftChildInVirtualRoot || !minLeftChildInVirtualRoot.children.length) {
          // 这就是最左
          break;
        }
        minLeftChildInVirtualRoot = minLeftChildInVirtualRoot.children[0];
      } while (true);

      // 如果最左子树一开始就不存在（需要作为右子树的是一个单节点）
      if (!minLeftChildInVirtualRoot) {
        // 直接构造一颗树就好
        stack.push({
          text: v,
          children: [
            { text: leftJoinTree.text, children: [] },
            { text: virtualRoot.text, children: [] },
          ],
        });
        return;
      }

      // 获取旧的最左子树值
      const minLeftChildInVirtualRootValue = minLeftChildInVirtualRoot.text;
      // 将运算符赋值给最左子树
      minLeftChildInVirtualRoot.text = v;

      // 将 leftJoinTree 整体作为最左子树的左子树
      minLeftChildInVirtualRoot.children.push(leftJoinTree);
      // 将旧的最左子树值作为一颗新的右子树
      minLeftChildInVirtualRoot.children.push({ text: minLeftChildInVirtualRootValue, children: [] });

      // 重新入栈
      stack.push(virtualRoot);
    });

    if (stack.length !== 1) {
      console.error('Error Stack Length!');
      return {};
    }

    // 因为终结符的存在，需要对原树进行改动
    return {
      text: '.',
      children: [stack[0], { text: '#', children: [] }],
    };
  };

  const main = () => {
    if (window.Treant && !window.unallowed14) {
      const chart = new Treant(TreeConfig, null, $);

      const input = $('#input');
      const submit = $('#submit');

      submit.on('click', () => {
        const value = input.val();
        input.val('');

        const regExpReversePolishExpression = getRegExpReversePolishExpression(value);

        TreeConfig.nodeStructure = makeTree(regExpReversePolishExpression);
        chart.tree.reload();
      });
    }

    // 模块导出
    window.makeAST = makeTree;
    window.getRegExpReversePolishExpression = getRegExpReversePolishExpression;
  };

  window.addEventListener('load', main);
})(window, undefined);
