import { getReversePolishExpression } from '../1.0/solution';
import { calculateReversePolishExpression } from '../1.1/solution';
import * as readline from 'readline';
import * as chalk from 'chalk';

const sc = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(chalk.blueBright('输入中缀四则运算表达式'));
sc.on('line', input => {
  console.log(`中缀四则运算表达式：${input}`);
  const reversePolishExpression = getReversePolishExpression(input);
  console.log(`后缀表达式：${reversePolishExpression}`);
  console.log(`计算结果：${calculateReversePolishExpression(reversePolishExpression)}`);

  sc.close();
});

sc.on('close', () => {
  console.log(chalk.blueBright('Process exit'));
  process.exit(0);
});
