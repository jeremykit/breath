# 呼吸默想引导

一个基于Web的呼吸冥想引导应用，提供多种呼吸训练协议，帮助用户改善睡眠质量和进行深度冥想练习。

## 项目简介

这是一个纯前端的单页应用（SPA），无需后端服务器，可直接部署到静态网站托管平台。通过视觉动画、音频提示和语音引导，为用户提供沉浸式的呼吸冥想体验。

## 主要功能

### 两种呼吸协议

#### 1. 睡眠呼吸 (4-7-8)
- **模式**: 吸气4秒 → 憋气7秒 → 呼气8秒
- **用途**: 助眠放松，快速入睡
- **可自定义循环次数**: 1-20次

#### 2. 神经重塑协议
一个完整的4步骤组合训练，适合深度冥想：
- **激活呼吸** (4-7-8): 唤醒身心状态
- **通路创建呼吸** (6-2-4): 建立神经连接
- **整合呼吸** (8-4-8): 整合身心体验
- **显化锁定呼吸** (10-10-10): 巩固冥想效果

每个步骤自动循环1次，整个协议可重复1-10轮。

### 交互体验

- **动态呼吸圆圈**: 随呼吸阶段动态变化大小和颜色
  - 吸气 (Inhale): 蓝色圆圈扩大
  - 憋气 (Hold): 紫色圆圈保持
  - 呼气 (Exhale): 绿色圆圈缩小

- **实时倒计时**: 显示当前呼吸阶段的剩余时间

- **进度追踪**: 显示当前轮次、步骤和循环进度

- **智能控制**:
  - 暂停/继续练习
  - 随时结束练习
  - 练习完成后可再次开始

### 声音与语音

- **节奏提示音**: 每秒的滴答声帮助保持节奏
- **语音引导**: 中文语音提示（吸气、憋气、呼气）
- **音量控制**: 0-100%可调节
- **独立开关**: 提示音和语音可分别开关

## 技术特性

### 前端技术
- **纯原生开发**: HTML5 + CSS3 + JavaScript ES6+
- **无框架依赖**: 零外部依赖，加载速度快
- **响应式设计**: 完美适配桌面端和移动端

### 现代浏览器API

#### Web Audio API
- 动态生成节奏提示音（800Hz正弦波）
- 练习完成提示音（C5音符）
- 音量实时控制

#### Speech Synthesis API
- 中文语音合成
- 自动播报协议名称和步骤
- 实时引导呼吸节奏

#### Wake Lock API
- 练习期间保持屏幕唤醒
- 防止自动锁屏影响练习
- 页面可见性变化自动恢复

### 视觉效果
- 紫色渐变背景
- 毛玻璃效果（backdrop-filter）
- 平滑的CSS过渡动画
- 动态阴影和发光效果

## 项目结构

```
breath/
├── index.html        # HTML结构
├── styles.css        # 样式表
├── script.js         # JavaScript逻辑
└── README.md         # 项目文档
```

## 本地开发

### 直接打开
由于是纯静态项目，可直接在浏览器中打开 `index.html` 文件。

### 使用本地服务器（推荐）
为避免某些浏览器的CORS限制，建议使用本地服务器：

```bash
# 使用 Python 3
python -m http.server 8000

# 使用 Node.js (http-server)
npx http-server -p 8000

# 使用 PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## 部署到 Cloudflare Pages

### 方法一：通过 GitHub Actions 自动部署（推荐）

#### 前置准备

1. **创建 Cloudflare API 令牌**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 `我的个人资料` → `API 令牌`
   - 点击 `创建令牌`
   - 选择 `编辑 Cloudflare Workers` 模板，或自定义权限：
     - `Account` → `Cloudflare Pages` → `Edit`
   - 创建后复制令牌（只显示一次）

2. **获取 Account ID**
   - 在 Cloudflare Dashboard 右侧边栏可找到
   - 或在任意域名的概览页面URL中查看

3. **配置 GitHub Secrets**
   - 进入你的 GitHub 仓库
   - `Settings` → `Secrets and variables` → `Actions`
   - 点击 `New repository secret` 添加以下密钥：
     - `CLOUDFLARE_API_TOKEN`: 你的 API 令牌
     - `CLOUDFLARE_ACCOUNT_ID`: 你的 Account ID

#### 自动部署流程

配置完成后，每次推送到 `main` 分支时会自动触发部署：

1. 推送代码到 GitHub
   ```bash
   git add .
   git commit -m "Update breath meditation app"
   git push origin main
   ```

2. GitHub Actions 自动运行
   - 检出代码
   - 部署到 Cloudflare Pages
   - 部署完成后可在 Actions 标签页查看日志

3. 访问你的网站
   - Cloudflare 会自动分配一个 `.pages.dev` 域名
   - 也可以绑定自定义域名

### 方法二：通过 Cloudflare Dashboard 手动部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `Pages` → `创建项目`
3. 连接你的 GitHub 仓库
4. 配置构建设置：
   - **构建命令**: 留空（无需构建）
   - **构建输出目录**: `/`
   - **环境变量**: 无需配置
5. 点击 `保存并部署`

### 方法三：使用 Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署项目
wrangler pages deploy . --project-name=breath-meditation
```

## 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| 基础功能 | ✅ | ✅ | ✅ | ✅ |
| Web Audio | ✅ | ✅ | ✅ | ✅ |
| 语音合成 | ✅ | ✅ | ✅ | ✅ |
| Wake Lock | ✅ | ❌ | ✅ (16.4+) | ✅ |

**推荐浏览器**: Chrome、Edge、Safari

## 使用指南

### 开始练习

1. **选择协议**: 点击选择睡眠呼吸或神经重塑协议
2. **设置次数**: 使用 +/- 按钮调整循环或轮数
3. **配置声音**:
   - 勾选/取消节奏提示音
   - 勾选/取消语音引导
   - 拖动滑块调整音量
4. **开始默想**: 点击"开始默想"按钮

### 练习中

- **跟随指引**: 根据圆圈动画和语音提示进行呼吸
- **暂停**: 需要中断时点击"暂停"，可继续恢复
- **结束**: 点击"结束"返回设置界面

### 最佳实践

- 建议在安静的环境中练习
- 使用耳机获得更好的音频体验
- 睡眠呼吸适合睡前使用
- 神经重塑协议适合深度冥想

## 技术实现亮点

### 状态管理
使用简洁的全局状态对象管理应用状态，包括协议选择、进度追踪、音频设置等。

### 定时器系统
基于 `setInterval` 实现精确的秒级计时，支持暂停/继续功能。

### 语音播报优化
- 步骤切换时暂停计时器，等待语音播报完成
- 避免语音重叠和混乱
- 移动端音频上下文自动恢复

### 移动端适配
- 处理移动端音频自动播放限制
- 响应式布局适配小屏幕
- 屏幕唤醒锁防止休眠

## 自定义与扩展

### 添加新的呼吸协议

在 `script.js` 中修改 `protocols` 对象：

```javascript
const protocols = {
  // 添加新协议
  custom: {
    name: '自定义呼吸',
    type: 'single',  // 或 'sequence'
    pattern: [5, 5, 5],  // [吸气秒数, 憋气秒数, 呼气秒数]
    defaultCycles: 10
  }
};
```

### 修改视觉样式

编辑 `styles.css` 中的颜色变量：

```css
/* 修改背景渐变 */
body {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* 修改呼吸圆圈颜色 */
.breath-circle.inhale {
  background: rgba(your-rgb, 0.3);
}
```

## License

MIT License - 自由使用和修改

## 贡献

欢迎提交 Issue 和 Pull Request！

## 致谢

本项目受到以下呼吸法的启发：
- Dr. Andrew Weil 的 4-7-8 呼吸法
- 现代神经科学研究的呼吸调节技术

---

**享受你的呼吸冥想之旅！** 🧘‍♀️✨
