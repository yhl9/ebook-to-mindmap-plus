# AI Providers Configuration Guide

## Overview

This guide will help you manually configure AI providers to use custom AI services in the ebook-to-mindmap application.

## Configuration File Location

Configuration file: `src/config/aiProviders.json`

## Configuration Structure

### Basic Structure

```json
{
  "providers": {
    "provider_id": {
      "name": "Provider Display Name",
      "apiUrl": "API Base URL",
      "models": [...],
      "parameters": {...}
    }
  }
}
```

### Detailed Configuration

#### 1. Provider Basic Information

```json
{
  "provider_id": {
    "name": "Provider Display Name",        // Name shown in the interface
    "apiUrl": "https://api.example.com/v1",  // API base URL
    "models": [...],               // Model list
    "parameters": {...}           // Parameter configuration
  }
}
```

#### 2. Model Configuration

```json
"models": [
  {
    "id": "model-id",                    // Unique model identifier
    "name": "Model Display Name",        // Name shown in the interface
    "description": "Model description"   // Detailed model description
  }
]
```

#### 3. Parameter Configuration

```json
"parameters": {
  "temperature": {
    "type": "number",           // Parameter type: number, string, boolean
    "min": 0,                   // Minimum value (for number type only)
    "max": 2,                   // Maximum value (for number type only)
    "default": 0.7,             // Default value
    "description": "Parameter description"   // Parameter description
  }
}
```

## Supported Parameter Types

### 1. Number Parameters
```json
{
  "type": "number",
  "min": 0,
  "max": 2,
  "default": 0.7,
  "description": "Controls output randomness"
}
```

### 2. String Parameters
```json
{
  "type": "string",
  "default": "auto",
  "description": "Output format"
}
```

### 3. Boolean Parameters
```json
{
  "type": "boolean",
  "default": true,
  "description": "Enable streaming output"
}
```

## Common Parameters

### Universal Parameters

| Parameter | Type | Description | Range |
|-----------|------|-------------|-------|
| `temperature` | number | Controls output randomness, higher values = more random | 0-2 |
| `maxTokens` | number | Controls maximum length of generated content | 1-8192 |
| `topP` | number | Controls diversity of generated content | 0-1 |
| `frequencyPenalty` | number | Reduces repetitive content | -2 to 2 |
| `presencePenalty` | number | Encourages new topics | -2 to 2 |

## Steps to Add New Providers

### Step 1: Determine Provider Information

1. **Provider ID**: Choose a unique identifier (e.g., `my-provider`)
2. **API URL**: Get the provider's API base URL
3. **Authentication**: Understand how to authenticate (API Key, Bearer Token, etc.)

### Step 2: Get Model Information

1. Check the list of models supported by the provider
2. Get the ID and description of each model
3. Understand the parameter requirements for each model

### Step 3: Write Configuration

```json
{
  "providers": {
    "my-provider": {
      "name": "My AI Provider",
      "apiUrl": "https://api.myprovider.com/v1",
      "models": [
        {
          "id": "model-1",
          "name": "Model 1",
          "description": "Fast response model"
        },
        {
          "id": "model-2", 
          "name": "Model 2",
          "description": "High quality model"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "Controls output randomness"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "Controls maximum length of generated content"
        }
      }
    }
  }
}
```

### Step 4: Update Application Code

1. **Add Provider Type**: Add new provider type in `src/services/aiService.ts`
2. **Implement Service Class**: Create corresponding service implementation class
3. **Update Factory Class**: Register new provider in `aiServiceFactory.ts`

## Configuration Examples

### OpenAI Configuration Example

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
          "description": "Cost-effective model"
        },
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "description": "Most powerful model"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 2,
          "default": 0.7,
          "description": "Controls output randomness"
        },
        "maxTokens": {
          "type": "number",
          "min": 1,
          "max": 4096,
          "default": 4000,
          "description": "Controls maximum length of generated content"
        }
      }
    }
  }
}
```

### Custom Provider Configuration Example

```json
{
  "providers": {
    "custom-ai": {
      "name": "Custom AI Service",
      "apiUrl": "https://api.custom-ai.com/v1",
      "models": [
        {
          "id": "custom-model-1",
          "name": "Custom Model 1",
          "description": "Model optimized for mind maps"
        }
      ],
      "parameters": {
        "temperature": {
          "type": "number",
          "min": 0,
          "max": 1,
          "default": 0.5,
          "description": "Controls output randomness"
        },
        "maxTokens": {
          "type": "number",
          "min": 100,
          "max": 2000,
          "default": 1000,
          "description": "Controls maximum length of generated content"
        },
        "style": {
          "type": "string",
          "default": "professional",
          "description": "Output style"
        }
      }
    }
  }
}
```

## Important Notes

### 1. Configuration Validation
- Ensure all required fields are filled
- Verify parameter types and ranges are correct
- Check if model IDs match the provider API

### 2. Performance Considerations
- Set reasonable default values for `maxTokens`
- Adjust `temperature` range based on model characteristics
- Consider response times of different models

### 3. Security
- Don't hardcode API keys in configuration files
- Use environment variables for sensitive information
- Regularly update API keys

## Troubleshooting

### Common Issues

1. **Configuration Not Taking Effect**
   - Check if JSON format is correct
   - Confirm file path is correct
   - Restart the application

2. **Models Not Available**
   - Verify model IDs are correct
   - Check if API URL is accessible
   - Confirm API keys are valid

3. **Parameter Errors**
   - Check if parameter types match
   - Verify parameter ranges are reasonable
   - Check API documentation for parameter requirements

### Debugging Tips

1. **Enable Debug Mode**: Check detailed error messages in browser console
2. **Check Network Requests**: Use developer tools to view API request status
3. **Validate Configuration**: Use online JSON validator to check configuration format

## Changelog

- **v1.0.0**: Initial version with basic configuration support
- **v1.1.0**: Added parameter type support
- **v1.2.0**: Support for custom parameters

## Technical Support

If you encounter issues during configuration, please:

1. Check the troubleshooting section of this document
2. Check the project's GitHub Issues
3. Contact technical support: yhluns@163.com

---

*Last updated: 2025.10 *
