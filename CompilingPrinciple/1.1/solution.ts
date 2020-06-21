export const calculateReversePolishExpression = (value: string): number => {
  // 只需要维护一个栈就好
  const calculate: Array<number> = [];

  // 用空格分离
  const origin = value.split(' ');

  // 常量
  const OPERATOR = ['+', '-', '*', '/'];

  // 遍历原值
  origin.forEach(v => {
    if (!OPERATOR.includes(v)) {
      // 数字，直接入栈
      calculate.push(parseFloat(v));
      return;
    }
    // 符号，出两个栈，第一个是操作数，第二个是被操作数
    // 进行运算后再入栈
    if (calculate.length < 2) {
      // 无法计算，异常
      throw new Error('无法计算，后缀表达式有错');
    }
    const operating = calculate.pop();
    const operated = calculate.pop();

    switch (v) {
      case '+':
        calculate.push(operated + operating);
        break;
      case '-':
        calculate.push(operated - operating);
        break;
      case '*':
        calculate.push(operated * operating);
        break;
      case '/':
        calculate.push(operated / operating);
        break;
      default:
        throw new Error(`无法计算，出现了奇怪的操作符 ${v}`);
    }
  });

  // 执行完之后，calculate 应当只剩一个
  if (calculate.length !== 1) {
    throw new Error('无法计算，后缀表达式有错');
  }

  return calculate.pop(); // 得出结果
};
