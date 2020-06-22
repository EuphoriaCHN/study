export const getReversePolishExpression = (value: string): string => {
  // 输入中缀表达式，返回后缀表达式

  // 模拟两个 stack
  const numberQueue: Array<string> = []; // 数字队列
  const operatorStack: Array<string> = []; // 运算符栈

  value = value.trim(); // 忽略首尾空格

  // 遍历 value
  let numberBuffer: Array<string> = []; // 转存多位数字
  value.split('').forEach((v: string, index: number) => {
    if (v === ' ') {
      // 忽略内部空格
      return;
    }
    if (!isNaN(parseInt(v))) {
      // 数字，存入缓冲区
      numberBuffer.push(v);
      return;
    }

    // 符号
    // 如果缓冲区内存在数字，出队缓冲区内部所有数字，并重置缓冲区
    if (numberBuffer.length) {
      numberQueue.push(numberBuffer.join(''));
      numberBuffer = [];
    }
    if (!operatorStack.length) {
      // 符号栈为空，压栈即可
      operatorStack.push(v);
      return;
    }
    // 符号栈不为空
    if (v === '(' || v === '*' || v === '/') {
      // 左括号、乘除号可以直接入栈
      operatorStack.push(v);
      return;
    }
    const operatorStackTop = operatorStack[operatorStack.length - 1]; // 找到符号栈顶元素

    if (v !== ')') {
      // 加号或减号
      if (operatorStackTop !== '*' && operatorStackTop !== '/') {
        // 没有出现运算优先级问题，可以直接入栈
        operatorStack.push(v);
        return;
      }
      // 出现了运算优先级问题，要取出当前符号栈顶元素，并将其放入数字队列中
      // 然后再将当前符号入符号栈
      numberQueue.push(operatorStack.pop());
      operatorStack.push(v);
      return;
    }
    // 右括号，需要一直出符号栈至数字队列内，直至遇到左括号
    while (operatorStack[operatorStack.length - 1] !== '(') {
      numberQueue.push(operatorStack.pop());
      if (!operatorStack.length) {
        // 异常处理
        throw new Error(`错误的语法！没有一个可以匹配下标 ${index} 处右括号的左侧括号`);
      }
    }
    // 最后还需要将当前这个 ( 出栈
    operatorStack.pop();
  });

  // 取出最后存在于缓冲区的数字
  // 最后一位一定是数字，
  if (numberBuffer.length) {
    numberQueue.push(numberBuffer.join(''));
  }

  // 最后将所有符号栈内的元素，依次出栈至数字队列内
  while (operatorStack.length) {
    numberQueue.push(operatorStack.pop());
  }

  return numberQueue.join(' '); // 数字队列的出队结果，就是后缀表达式
};
