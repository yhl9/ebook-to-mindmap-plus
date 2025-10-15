import { AIService } from './geminiService'
import { DeepSeekService } from './deepseekService'
import type { AIConfig } from '../stores/configStore'

export class AIServiceFactory {
  static createService(config: AIConfig | (() => AIConfig)): AIService {
    const currentConfig = typeof config === 'function' ? config() : config
    
    switch (currentConfig.provider) {
      case 'deepseek':
        return new DeepSeekService(config)
      case 'gemini':
        return new AIService(config)
      case 'openai':
        return new AIService(config)
      default:
        throw new Error(`不支持的AI提供商: ${currentConfig.provider}`)
    }
  }
}
