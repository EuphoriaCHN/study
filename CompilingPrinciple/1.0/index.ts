import { getReversePolishExpression } from './solution';
import * as readline from 'readline';
import * as chalk from 'chalk';

const sc = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(chalk.blueBright('输入中缀四则运算（可以携带括号）表达式'));
sc.on('line', input => {
  console.log(`中缀表达式：${input}`);
  console.log(`后缀表达式：${getReversePolishExpression(input)}`);

  sc.close();
});

sc.on('close', () => {
  console.log(chalk.blueBright('Process exit'));
  process.exit(0);
});
