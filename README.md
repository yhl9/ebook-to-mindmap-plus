# 电子书转思维导图

[English](README.en.md) | 中文

一个基于 AI 技术的智能电子书解析工具，支持将 EPUB 和 PDF 格式的电子书转换为结构化的思维导图和文字总结。

## ✨ 功能特性

### 📚 多格式支持

- **EPUB 文件**：完整支持 EPUB 格式电子书的解析和处理
- **PDF 文件**：智能解析 PDF 文档，支持基于目录和智能检测的章节提取

### 🤖 AI 驱动的内容处理

- **多种 AI 服务**：支持 6 大主流 AI 服务提供商
  - **Google Gemini**：Gemini 1.5 Flash/Pro 模型
  - **OpenAI**：GPT-3.5 Turbo、GPT-4、GPT-4 Turbo
  - **DeepSeek**：DeepSeek Chat、DeepSeek Reasoner
  - **Anthropic Claude**：Claude 3 Sonnet、Claude 3 Opus
  - **硅基流动 SiliconFlow**：DeepSeek-R1、DeepSeek-V2.5（免费）
  - **OpenRouter**：Llama 3.1、Phi-3、Gemma 2、Mistral 等（免费）
- **三种处理模式**：
  - 📝 **文字总结模式**：生成章节总结、分析章节关联、输出全书总结
  - 🧠 **章节思维导图模式**：为每个章节生成独立的思维导图
  - 🌐 **整书思维导图模式**：将整本书内容整合为一个完整的思维导图

### 🎯 智能章节处理

- **智能章节检测**：自动识别和提取书籍章节结构
- **章节筛选**：支持跳过前言、目录、致谢等非核心内容
- **灵活选择**：用户可自由选择需要处理的章节
- **子章节支持**：可配置子章节提取深度

### 💾 高效缓存机制

- **智能缓存**：自动缓存 AI 处理结果，避免重复计算
- **缓存管理**：支持按模式清除缓存，节省存储空间
- **离线查看**：已处理的内容可离线查看

### 🎨 现代化界面

- **响应式设计**：适配各种屏幕尺寸
- **实时进度**：处理过程可视化，实时显示当前步骤
- **交互式思维导图**：支持缩放、拖拽、节点展开/折叠
- **内容预览**：支持查看原始章节内容
- **多语言支持**：支持中文、英文界面切换
- **智能语言检测**：自动检测并适配用户语言偏好

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/yhl9/ebook-to-mindmap-plus
cd ebook-to-mindmap-plus

# 安装依赖
pnpm install
# 或
npm install
```

### 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

访问 `http://localhost:5173` 开始使用。

## 📖 使用指南

### 1. 配置 AI 服务

首次使用需要配置 AI 服务：

1. 点击「配置」按钮
2. 选择 AI 服务提供商：
   - **硅基流动 SiliconFlow**(推荐，很显然，免费嘛...嘿嘿，你懂的...)
   - **OpenRouter** (推荐，还是因为免费。不过调用次数太少了一点。好在可以测试更多的模型。)
   - **DeepSeek**：（推荐，原因：便宜，性价比拉满）DeepSeek Chat、DeepSeek Reasoner
   - **Google Gemini** ：需要 Gemini API Key （需要梯）
   - **OpenAI GPT**：需要 OpenAI API Key 和 API 地址 （需要梯）

3. 输入相应的 API Key
4. 选择模型（可选，使用默认模型即可）

#### 获取 API Key

**Google Gemini API Key**：

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 登录 Google 账号
3. 创建新的 API Key
4. 复制 API Key 到配置中

**OpenAI API Key**：

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录并进入 API Keys 页面
3. 创建新的 API Key
4. 复制 API Key 到配置中

### 💰 免费 AI 服务

本应用支持多个免费 AI 服务，无需付费即可使用：

- **硅基流动 SiliconFlow**：提供 DeepSeek-R1、DeepSeek-V2.5 等免费模型
- **OpenRouter**：提供多个免费模型，包括：
  - Llama 3.1 8B/70B Instruct
  - Phi-3 Mini/Medium 128K Instruct  
  - Gemma 2 9B/27B IT
  - Mistral 7B/Mixtral 8x7B Instruct
  - 等多个开源模型

这里还有一些[免费方案](https://github.com/SSShooter/Video-Summary/blob/master/guide/index.md)可供参考。

### 2. 上传电子书文件

1. 点击「选择 EPUB 或 PDF 文件」按钮
2. 选择要处理的电子书文件
3. 支持的格式：`.epub`、`.pdf`

### 3. 配置处理选项

在配置对话框中设置处理参数：

#### 处理模式

- **文字总结模式**：适合需要文字总结的场景，生成章节总结、分析章节关联、输出全书总结
- **章节思维导图模式**：为每个章节生成独立思维导图，便于分章节学习
- **整书思维导图模式**：生成整本书的统一思维导图，展示全书知识结构

#### 书籍类型

- **小说类**：适用于小说、故事类书籍
- **非小说类**：适用于教材、工具书、技术书籍等

#### 高级选项

- **智能章节检测**：启用后会使用 AI 智能识别章节边界
- **跳过无关章节**：自动跳过前言、目录、致谢等内容
- **子章节深度**：设置提取子章节的层级深度（0-5）
- **输出语言**：支持中文、英文、日文、法文、德文、西班牙文、俄文等多种语言
- **自定义提示词**：支持添加自定义提示词，指导 AI 生成更符合需求的内容

### 4. 提取章节

1. 点击「提取章节」按钮
2. 系统会自动解析文件并提取章节结构
3. 提取完成后会显示章节列表
4. 可以选择需要处理的章节（默认全选）

### 5. 开始处理

1. 确认选择的章节
2. 点击「开始处理」按钮
3. 系统会显示处理进度和当前步骤
4. 处理完成后会显示结果

### 6. 查看结果

根据选择的处理模式，可以查看不同类型的结果：

#### 文字总结模式

- **章节总结**：每个章节的详细总结
- **章节关联**：分析章节之间的逻辑关系
- **全书总结**：整本书的核心内容总结

#### 思维导图模式

- **交互式思维导图**：可缩放、拖拽的思维导图
- **节点详情**：点击节点查看详细内容
- **导出功能**：支持导出为图片或其他格式

## 🛠️ 技术架构

### 核心技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS + shadcn/ui
- **状态管理**：Zustand
- **国际化**：react-i18next
- **文件解析**：
  - EPUB：@smoores/epub + epubjs
  - PDF：pdfjs-dist
- **思维导图**：mind-elixir + @mind-elixir/export-mindmap
- **AI 服务**：
  - Google Gemini：@google/generative-ai
  - OpenAI：自定义实现
  - DeepSeek：自定义实现
  - Claude：自定义实现
  - SiliconFlow：自定义实现
  - OpenRouter：自定义实现
- **缓存系统**：本地存储 + 智能缓存管理
- **导出功能**：多格式导出支持

## 🔧 高级功能

### 缓存管理

系统会自动缓存 AI 处理结果，提高效率：

- **自动缓存**：处理结果会自动保存到本地
- **智能复用**：相同内容不会重复处理
- **缓存清理**：可按模式清除特定类型的缓存
- **存储优化**：缓存数据经过压缩，节省存储空间

### 批量处理

- **章节选择**：支持批量选择/取消选择章节
- **并发处理**：多个章节可并行处理（受 API 限制）
- **断点续传**：处理中断后可从上次位置继续
- **自定义提示词**：支持为每个处理任务添加自定义提示词
- **多语言输出**：支持指定 AI 生成内容的语言

### 导出功能

- **思维导图导出**：支持多种格式导出
  - **图片格式**：PNG、JPEG、WEBP
  - **文档格式**：HTML、Markdown
  - **数据格式**：JSON（便于二次处理）
- **MindElixir 集成**：支持在 MindElixir Desktop 中打开思维导图
- **数据备份**：支持导出处理结果数据，便于离线查看

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目：

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [mind-elixir](https://github.com/ssshooter/mind-elixir-core)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [epub.js](https://github.com/futurepress/epub.js/)

---

如有问题或建议，欢迎提交 Issue 或联系开发者。
