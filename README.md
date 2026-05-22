# BangCaptcha 🎸

```bash
pnpm i
pnpm dev
```

## API

* `GET /api/captcha`: 获取验证码，返回挑战 ID 和图片列表
* `POST /api/verify`: 提交验证，需包含用户鼠标轨迹等数据防机器作弊

## 安全与防护特性

- **加密随机抽取**：基于 Node.js `crypto` 模块而非 `Math.random`，杜绝伪随机数预测。
- **服务端生命周期管理**：完全由服务端把控验证时间 (startTime / createdAt) 防止篡改。
- **自动资源回收**：随验证生命周期成组销毁图片 Token，避免内存泄露。
- **Bot 检测机制**：严格的数组越界校验与鼠标轨迹有效性（位移验证）分析。
- **限流防护**：基于 IP 的 API 限流保护 (Rate Limit) 及 JSON body 体积限制。

## 前端接入 Demo

参考 `demo/Captcha.tsx`，这是一个无外部依赖（除 React 外）的验证码组件。可以直接挂载使用：

```tsx
import { BangCaptcha } from './Captcha';

export default function App() {
  return (
    <BangCaptcha 
      onSuccess={(token) => console.log('验证成功', token)}
      onFail={(msg) => console.error('验证失败', msg)}
    />
  )
}
```
