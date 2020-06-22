export const getRegExpReversePolishExpression = (input: string): string => {
  // 维护一个终结符队列
  const alphaQueue = [];
  // 维护一个操作符栈
  const operatorStack = [];

  // 维护一个 flag，判断是否是并集运算
  let unionFlag = false;

  // 遍历输入数据
  input.split('').forEach((v: string, index: number) => {
    if (v === '(' || v === '|') {
      // 普通运算符，直接可以入栈
      unionFlag = false; // 不是连续出现的终结符组合
      operatorStack.push(v);
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
      unionFlag = true; // 下一个如果是终结符，一定是并运算
      return;
    }
    // 终结符组合
    if (unionFlag) {
      // 当前的终结符相对于上一个组合是并运算
      operatorStack.push('.');
    }
    unionFlag = true; // 下一个如果是终结符，一定是并运算
    alphaQueue.push(v);
  });

  // 出操作符栈，直至栈空
  while (operatorStack.length) {
    alphaQueue.push(operatorStack.pop());
  }

  return alphaQueue.join('');
};
