// https://visjs.github.io/vis-network/docs/network/nodes.html

// Node 节点定义：
// { id: number; label: string; shape: 'circle' }

// Edge 定义：
// { from: number; to: number; label: string; arrows: 'to' }

((window, undefined) => {
  const getNFAGraph = reversePolishExpression => {
    // 根据逆波兰正则表达式生成 NFA
    if (!reversePolishExpression.length) {
      return { nodes: [], edges: [] };
    }

    // 维护 NODE 数据自增 id，同时作为 node 主键标示
    let nodeId = 0;

    // 维护常量组
    const EPSILON = 'ε'; // 空
    const START = 'start';
    const END = 'end';

    // 维护节点集合，用
    const nodes = {};
    // 传入 label，获得一个节点
    const makeNode = label => {
      const _id = nodeId++;
      const _label = label || `${_id}`;
      return { id: _id, label: _label, shape: 'circle' };
    };
    // 为 NFA 增加 n 个 node
    const addNode = (...virtualNodes) => {
      virtualNodes.forEach(virtualNode => {
        nodes[virtualNode.id] = virtualNode;
      });
    };
    // 根据 id 删除一个 node
    const removeNode = id => {
      delete nodes[id];
      // TODO: 是否需要删除与其有关联的 edge？
    };

    // 维护边集合
    const edges = {};
    // 维护边集合唯一 id
    let edgeId = 1;
    // 传入 label、from、to，获得一条从 from 指向 to，权重是 label 的边
    const makeEdge = (label, fromId, toId) => ({ label, from: fromId, to: toId, arrows: 'to', id: edgeId++ });
    // 为 NFA 增加 n 条边
    const addEdge = (...virtualEdges) => {
      virtualEdges.forEach(virtualEdge => {
        edges[virtualEdge.id] = virtualEdge;
      });
    };
    // 为 NFA 删除一条边
    const removeEdge = id => {
      delete edges[id];
    };

    // 维护一个开始节点
    const start = makeNode('start');

    // 维护一个结束节点
    const end = makeNode('end');

    /**
     * 传入一个单状态，获得一颗 NFA 子树
     * a => Start -a-> End
     * @param {string} edgeLabel 状态
     */
    const single = edgeLabel => {
      const from = makeNode();
      const to = makeNode();
      const edge = makeEdge(edgeLabel, from.id, to.id);

      addNode(from, to);
      addEdge(edge);

      return { from, to };
    };

    /**
     * 并运算
     */
    const cat = (leftNode, rightNode) => {
      // 并运算只需要新增一个边就好
      const leftNodeEndToRightNodeStarEdge = makeEdge(EPSILON, leftNode.to.id, rightNode.from.id);
      addEdge(leftNodeEndToRightNodeStarEdge);

      return { from: leftNode.from, to: rightNode.to };
    };

    /**
     * 或运算
     */
    const or = (leftNode, rightNode) => {
      // 或运算需要新增四条边和两个节点
      const newFrom = makeNode();
      const newTo = makeNode();

      const newFromToLeftNodeFromEdge = makeEdge(EPSILON, newFrom.id, leftNode.from.id);
      const newFromToRightNodeFromEdge = makeEdge(EPSILON, newFrom.id, rightNode.from.id);
      const LeftNodeEndToNewToEdge = makeEdge(EPSILON, leftNode.to.id, newTo.id);
      const rightNodeEndToNewToEdge = makeEdge(EPSILON, rightNode.to.id, newTo.id);

      addNode(newFrom, newTo);
      addEdge(newFromToLeftNodeFromEdge, newFromToRightNodeFromEdge, LeftNodeEndToNewToEdge, rightNodeEndToNewToEdge);

      return { from: newFrom, to: newTo };
    };

    /**
     * 克林闭包
     */
    const closure = node => {
      // 克林闭包需要新增四条边和两个节点
      const newFrom = makeNode();
      const newTo = makeNode();

      const newFromToOriginFromEdge = makeEdge(EPSILON, newFrom.id, node.from.id);
      const originEndToOriginFromEdge = makeEdge(EPSILON, node.to.id, node.from.id);
      const originEndToNewEndEdge = makeEdge(EPSILON, node.to.id, newTo.id);
      const newFromToNewEnd = makeEdge(EPSILON, newFrom.id, newTo.id);

      addNode(newFrom, newTo);
      addEdge(newFromToOriginFromEdge, originEndToOriginFromEdge, originEndToNewEndEdge, newFromToNewEnd);

      return { from: newFrom, to: newTo };
    };

    // 维护每个运算符与其对应的操作集合
    const OPERATOR = {
      '.': cat,
      '|': or,
      '*': closure,
    };

    // 维护后缀表达式计算栈
    // Node = {id: number, label: string, shape: 'circle'}
    // Array<{ from: Node, to: Node }>
    const stack = [];

    // 遍历每一个数据
    reversePolishExpression.split('').forEach(v => {
      if (!Object.keys(OPERATOR).includes(v)) {
        // v 不属于操作符，那么只需要构建一个指向就好
        stack.push(single(v));
        return;
      }
      if (v === '*') {
        // 当前操作是克林闭包，计算一个元素即可
        if (!stack.length) {
          throw new Error('错误的栈顶元素！无法计算克林闭包');
        }
        const top = stack.pop();
        stack.push(closure(top));
        return;
      }
      // 剩下的都是双目运算符，一次出两个栈
      if (stack.length < 2) {
        throw new Error('栈内元素少于两个！不能计算双目运算符！');
      }
      const back = stack.pop();
      const front = stack.pop();
      stack.push(OPERATOR[v](front, back));
    });

    if (stack.length !== 1) {
      throw new Error(`错误的栈元素数量！请检查后缀表达式！${reversePolishExpression}`);
    }

    // 将整个图的开始节点和结束节点连接到栈内
    const top = stack.pop();

    const startToOriginEdge = makeEdge(START, start.id, top.from.id);
    const originToEnd = makeEdge(END, top.to.id, end.id);

    addNode(start, end);
    addEdge(startToOriginEdge, originToEnd);

    const graphNodes = Object.values(nodes);
    const graphEdges = Object.values(edges);

    // 计算图的邻接矩阵
    const adjacencyMatrix = {};
    graphNodes.forEach(v => {
      const initRows = {};
      graphNodes.forEach(v => {
        initRows[v.id] = null;
      });
      adjacencyMatrix[v.id] = initRows;
    });

    graphEdges.forEach(edges => {
      const { from, to, label } = edges;
      if (!adjacencyMatrix[from][to]) {
        adjacencyMatrix[from][to] = [];
      }
      adjacencyMatrix[from][to].push(label);
    });

    return { nodes: graphNodes, edges: graphEdges, adjacencyMatrix };
  };

  // 根据一颗抽象语法树，获得 NFA
  const getNFAGraphWithAST = AST => {
    // 后序遍历抽象语法树，记录节点编号，将值存入队列
    const ans = [];

    // 维护常量组
    const EPSILON = 'ε'; // 空
    const START = 'start';
    const END = 'end';

    /**
     * 传入一个单状态，获得一颗 NFA 子树
     * a => Start -a-> End
     */
    const single = (edgeLabel, nodeNameInAST) => {
      const from = makeNode(nodeNameInAST, true);
      const to = makeNode();
      const edge = makeEdge(edgeLabel, from.id, to.id);

      addNode(from, to);
      addEdge(edge);

      return { from, to };
    };

    /**
     * 并运算
     */
    const cat = (leftNode, rightNode) => {
      // 并运算只需要新增一个边就好
      const leftNodeEndToRightNodeStarEdge = makeEdge(EPSILON, leftNode.to.id, rightNode.from.id);
      addEdge(leftNodeEndToRightNodeStarEdge);

      return { from: leftNode.from, to: rightNode.to };
    };

    /**
     * 或运算
     */
    const or = (leftNode, rightNode) => {
      // 或运算需要新增四条边和两个节点
      const newFrom = makeNode();
      const newTo = makeNode();

      const newFromToLeftNodeFromEdge = makeEdge(EPSILON, newFrom.id, leftNode.from.id);
      const newFromToRightNodeFromEdge = makeEdge(EPSILON, newFrom.id, rightNode.from.id);
      const LeftNodeEndToNewToEdge = makeEdge(EPSILON, leftNode.to.id, newTo.id);
      const rightNodeEndToNewToEdge = makeEdge(EPSILON, rightNode.to.id, newTo.id);

      addNode(newFrom, newTo);
      addEdge(newFromToLeftNodeFromEdge, newFromToRightNodeFromEdge, LeftNodeEndToNewToEdge, rightNodeEndToNewToEdge);

      return { from: newFrom, to: newTo };
    };

    /**
     * 克林闭包
     */
    const closure = node => {
      // 克林闭包需要新增四条边和两个节点
      const newFrom = makeNode();
      const newTo = makeNode();

      const newFromToOriginFromEdge = makeEdge(EPSILON, newFrom.id, node.from.id);
      const originEndToOriginFromEdge = makeEdge(EPSILON, node.to.id, node.from.id);
      const originEndToNewEndEdge = makeEdge(EPSILON, node.to.id, newTo.id);
      const newFromToNewEnd = makeEdge(EPSILON, newFrom.id, newTo.id);

      addNode(newFrom, newTo);
      addEdge(newFromToOriginFromEdge, originEndToOriginFromEdge, originEndToNewEndEdge, newFromToNewEnd);

      return { from: newFrom, to: newTo };
    };

    // 维护操作符
    const OPERATOR = {
      '.': cat,
      '|': or,
      '*': closure,
    };

    // count 叶子结点
    let leaveNodeCount = 1;
    // count 操作节点
    let operatorNodeCount = 1;

    // 后序遍历抽象语法树
    const postorderTraversalAST = node => {
      if (!node) {
        return;
      }
      postorderTraversalAST(node.children[0]);
      postorderTraversalAST(node.children[1]);
      const nodeLabel = Object.keys(OPERATOR).includes(node.text) ? `n${operatorNodeCount++}` : `${leaveNodeCount++}`;
      const data = {
        nodeLabel,
        label: node.text,
      };

      ans.push(data);
    };

    postorderTraversalAST(AST); // 后续遍历抽象语法树

    // 维护 Node id
    let nodeId = 0;
    // 维护节点集合，用
    const nodes = {};
    // 传入 label，获得一个节点
    const makeNode = (label, styles = false) => {
      const _id = nodeId++;
      const _label = label || '';

      const newNode = { id: _id, label: _label, shape: 'circle' };

      if (styles) {
        newNode.color = {
          background: '#f9f2f4',
          border: '#f5771c',
        };
      }

      return newNode;
    };
    // 为 NFA 增加 n 个 node
    const addNode = (...virtualNodes) => {
      virtualNodes.forEach(virtualNode => {
        nodes[virtualNode.id] = virtualNode;
      });
    };

    // 维护边集合
    const edges = {};
    // 维护边集合唯一 id
    let edgeId = 1;
    // 传入 label、from、to，获得一条从 from 指向 to，权重是 label 的边
    const makeEdge = (label, fromId, toId) => ({ label, from: fromId, to: toId, arrows: 'to', id: edgeId++ });
    // 为 NFA 增加 n 条边
    const addEdge = (...virtualEdges) => {
      virtualEdges.forEach(virtualEdge => {
        edges[virtualEdge.id] = virtualEdge;
      });
    };

    // 维护一个开始节点
    const start = makeNode('start');

    // 维护一个结束节点
    const end = makeNode('end');

    // 维护一个计算栈
    const stack = [];

    ans.forEach(v => {
      // 逐项出队
      if (!Object.keys(OPERATOR).includes(v.label)) {
        // 不属于操作符，可以直接入栈
        stack.push(single(v.label, v.nodeLabel));
        return;
      }
      if (v.label === '*') {
        // 当前操作是克林闭包，计算一个元素即可
        if (!stack.length) {
          throw new Error('错误的栈顶元素！无法计算克林闭包');
        }
        const top = stack.pop();
        stack.push(closure(top));
        return;
      }
      // 剩下的都是双目运算符，一次出两个栈
      if (stack.length < 2) {
        throw new Error('栈内元素少于两个！不能计算双目运算符！');
      }
      const back = stack.pop();
      const front = stack.pop();
      stack.push(OPERATOR[v.label](front, back));
    });

    if (stack.length !== 1) {
      throw new Error(`错误的栈元素数量！请检查后缀表达式！${reversePolishExpression}`);
    }

    // 将整个图的开始节点和结束节点连接到栈内
    const top = stack.pop();

    const startToOriginEdge = makeEdge(START, start.id, top.from.id);
    const originToEnd = makeEdge(END, top.to.id, end.id);

    addNode(start, end);
    addEdge(startToOriginEdge, originToEnd);

    const graphNodes = Object.values(nodes);
    const graphEdges = Object.values(edges);

    // 计算图的邻接矩阵
    const adjacencyMatrix = {};
    graphNodes.forEach(v => {
      const initRows = {};
      graphNodes.forEach(v => {
        initRows[v.id] = null;
      });
      adjacencyMatrix[v.id] = initRows;
    });

    graphEdges.forEach(edges => {
      const { from, to, label } = edges;
      if (!adjacencyMatrix[from][to]) {
        adjacencyMatrix[from][to] = [];
      }
      adjacencyMatrix[from][to].push(label);
    });

    return { nodes: graphNodes, edges: graphEdges, adjacencyMatrix };
  };

  const main = () => {
    const inputElement = $('#input');
    const submitButton = $('#submit');
    const submitWithAST = $('#submitWithAST');

    if (window.vis && !window.unallowed15) {
      // Canvas 画布
      const container = document.getElementById('network');
      const network = new vis.Network(container, { nodes: [], edges: [] }, {});

      submitButton.on('click', () => {
        const value = inputElement.val();
        inputElement.val('');

        // 获得后缀表达式
        const reversePolishExpression = window.getRegExpReversePolishExpression(value);

        const { nodes, edges } = getNFAGraph(reversePolishExpression);
        network.setData({ nodes, edges });
        network.redraw();
      });

      submitWithAST.on('click', () => {
        const value = inputElement.val();
        inputElement.val('');

        // 获得后缀表达式
        const reversePolishExpression = window.getRegExpReversePolishExpression(value);
        // 根据后缀表达式获得 AST
        const AST = window.makeAST(reversePolishExpression);

        const { nodes, edges } = getNFAGraphWithAST(AST);
        network.setData({ nodes, edges });
        network.redraw();
      });
    }

    window.getNFAGraph = getNFAGraph; // 模块导出
    window.submitWithAST = getNFAGraphWithAST;
  };

  window.addEventListener('load', main);
})(window, undefined);
