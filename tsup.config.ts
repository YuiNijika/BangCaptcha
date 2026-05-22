import { defineConfig } from 'tsup';
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node20',
  clean: true,
  minify: false, // 禁用默认的压缩，改用 obfuscator
  splitting: false,
  outDir: 'dist',
  onSuccess: async () => {
    console.log('Running javascript-obfuscator...');
    const buildFile = path.resolve(__dirname, 'dist/index.js');
    const code = fs.readFileSync(buildFile, 'utf8');
    
    // 配置高级混淆选项
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
      compact: true, // 压缩代码
      controlFlowFlattening: true, // 控制流平坦化
      controlFlowFlatteningThreshold: 0.75, // 控制流平坦化概率
      deadCodeInjection: true, // 注入死代码
      deadCodeInjectionThreshold: 0.4, // 死代码注入概率
      debugProtection: true, // 禁止调试
      debugProtectionInterval: 4000,
      disableConsoleOutput: false, // 禁用 console 输出 (如果你还需要日志可以关掉这个)
      identifierNamesGenerator: 'hexadecimal', // 标识符混淆
      log: false,
      numbersToExpressions: true, // 数字转表达式
      renameGlobals: false, // 不重命名全局变量以免破坏 node 内置模块
      selfDefending: true, // 自我保护，防格式化
      simplify: true,
      splitStrings: true, // 字符串拆分
      splitStringsChunkLength: 10,
      stringArray: true, // 字符串数组
      stringArrayCallsTransform: true,
      stringArrayCallsTransformThreshold: 0.5,
      stringArrayEncoding: ['base64', 'rc4'], // 字符串加密
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 1,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 2,
      stringArrayWrappersType: 'variable',
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false // 避免过长
    });

    fs.writeFileSync(buildFile, obfuscationResult.getObfuscatedCode());
    console.log('Obfuscation completed successfully.');
  }
});