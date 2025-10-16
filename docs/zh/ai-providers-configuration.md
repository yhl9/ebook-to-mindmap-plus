# AI 提供商配置指南

## 概述

本指南将帮助您手动配置 AI 提供商，以便在电子书转思维导图应用中使用自定义的 AI 服务。

## 配置文件位置

配置文件位于：`src/config/aiProviders.json`

## 配置结构

### 基本结构

```json
{
  "providers": {
    "provider_id": {
      "name": "提供商显示名称",
      "apiUrl": "API 基础URL",
      "models": [...],
      "parameters": {...}
    }
  }
}
```

### 详细配置说明

#### 1. 提供商基本信息

```json
{
  "provider_id": {
    "name": "提供商显示名称",        // 在界面中显示的名称
    "apiUrl": "https://api.example.com/v1",  // API 基础URL
    "models": [...],               // 模型列表
    "parameters": {...}           // 参数配置
  }
}
```

#### 2. 模型配置

```json
"models": [
  {
    "id": "model-id",                    // 模型唯一标识符
    "name": "模型显示名称",               // 在界面中显示的名称
    "description": "模型描述信息"        // 模型的详细描述
  }
]
```

#### 3. 参数配置

```json
"parameters": {
  "temperature": {
    "type": "number",           // 参数类型：number, string, boolean
    "min": 0,                   // 最小值（仅适用于number类型）
    "max": 2,                   // 最大值（仅适用于number类型）
    "default": 0.7,             // 默认值
    "description": "参数描述"   // 参数说明
  }
}
```

## 支持的参数类型

### 1. 数值参数 (number)
```json
{
  "type": "number",
  "min": 0,
  "max": 2,
  "default": 0.7,
  "description": "控制输出的随机性"
}
```

### 2. 字符串参数 (string)
```json
{
  "type": "string",
  "default": "auto",
  "description": "输出格式"
}
```

### 3. 布尔参数 (boolean)
```json
{
  "type": "boolean",
  "default": true,
  "description": "是否启用流式输出"
}
```

## 常用参数说明

### 通用参数

| 参数名 | 类型 | 描述 | 范围 |
|--------|------|------|------|
| `temperature` | number | 控制输出的随机性，值越高越随机 | 0-2 |
| `maxTokens` | number | 控制生成内容的最大长度 | 1-8192 |
| `topP` | number | 控制生成内容的多样性 | 0-1 |
| `frequencyPenalty` | number | 减少重复内容 | -2到2 |
| `presencePenalty` | number | 鼓励新话题 | -2到2 |

## 添加新提供商的步骤

### 步骤 1：确定提供商信息

1. **提供商ID**：选择一个唯一的标识符（如：`my-provider`）
2. **API URL**：获取提供商的API基础URL
3. **认证方式**：了解如何认证（API Key、Bearer Token等）

### 步骤 2：获取模型信息

1. 查看提供商支持的模型列表
2. 获取每个模型的ID和描述
3. 了解每个模型的参数要求

### 步骤 3：编写配置

```json
{
  "providers": {
    "my-provider": {
      "name": "我的AI提供商",
      "apiUrl": "https://api.myprovider.com/v1",
      "models": [
        {
          "id": "model-1",
          "name": "模型1",
          "description": "快速响应模型"
        },
        {
          "id": "model-2", 
          "name": "模型2",
          "description": "高质量模型"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "控制输出的随机性"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "控制生成内容的最大长度"
        }
      }
    }
  }
}
```

### 步骤 4：更新应用代码

1. **添加提供商类型**：在 `src/services/aiService.ts` 中添加新的提供商类型
2. **实现服务类**：创建对应的服务实现类
3. **更新工厂类**：在 `aiServiceFactory.ts` 中注册新提供商

## 配置示例

### OpenAI 配置示例

```json
{
  "providers": {
    "openai": {
      "name": "OpenAI",
      "apiUrl": "https://api.openai.com/v1",
      "models": [
        {
          "id": "gpt-3.5-turbo",
          "name": "GPT-3.5 Turbo",
          "description": "经济实惠的模型"
        },
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "description": "最强大的模型"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "控制输出的随机性"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "控制生成内容的最大长度"
        }
      }
    }
  }
}
```

### 自定义提供商配置示例

```json
{
  "providers": {
    "custom-ai": {
      "name": "自定义AI服务",
      "apiUrl": "https://api.custom-ai.com/v1",
      "models": [
        {
          "id": "custom-model-1",
          "name": "自定义模型1",
          "description": "专为思维导图优化的模型"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 1,
          "default": 0.5,
          "description": "控制输出的随机性"
        },
        "maxTokens": {
          "type": "number",
          "min": 100,
          "max": 2000,
          "default": 1000,
          "description": "控制生成内容的最大长度"
        },
        "style": {
          "type": "string",
          "default": "professional",
          "description": "输出风格"
        }
      }
    }
  }
}
```

## 注意事项

### 1. 配置验证
- 确保所有必需的字段都已填写
- 验证参数类型和范围是否正确
- 检查模型ID是否与提供商API匹配

### 2. 性能考虑
- 合理设置 `maxTokens` 默认值
- 根据模型特性调整 `temperature` 范围
- 考虑不同模型的响应时间

### 3. 安全性
- 不要在配置文件中硬编码API密钥
- 使用环境变量存储敏感信息
- 定期更新API密钥

## 故障排除

### 常见问题

1. **配置不生效**
   - 检查JSON格式是否正确
   - 确认文件路径是否正确
   - 重启应用

2. **模型不可用**
   - 验证模型ID是否正确
   - 检查API URL是否可访问
   - 确认API密钥是否有效

3. **参数错误**
   - 检查参数类型是否匹配
   - 验证参数范围是否合理
   - 查看API文档确认参数要求

### 调试技巧

1. **启用调试模式**：在浏览器控制台查看详细错误信息
2. **检查网络请求**：使用开发者工具查看API请求状态
3. **验证配置**：使用在线JSON验证器检查配置格式

## 更新日志

- **v1.0.0**：初始版本，支持基本配置
- **v1.1.0**：添加参数类型支持
- **v1.2.0**：支持自定义参数

## 技术支持

如果您在配置过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的GitHub Issues
3. 联系技术支持：yhluns@163.com

---

*最后更新：2025年10月*
