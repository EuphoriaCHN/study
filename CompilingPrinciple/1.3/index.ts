import * as readline from 'readline';
import * as chalk from 'chalk';

import { getRegExpReversePolishExpression } from './solution';

const sc = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(chalk.blueBright('输入正则表达式：'));
sc.on('line', input => {
  console.log(`正则表达式：${input}`);
  console.log(`后缀正则表达式：${getRegExpReversePolishExpression(input)}`);

  sc.close();
});

sc.on('close', () => {
  console.log(chalk.blueBright('Process exit'));
  process.exit(0);
});
