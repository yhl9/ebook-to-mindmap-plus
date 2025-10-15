import { AIService } from './geminiService'
import { getLanguageInstruction, type SupportedLanguage } from './prompts/utils'
import type { AIConfig } from '../stores/configStore'

export class DeepSeekService extends AIService {
  constructor(config: AIConfig | (() => AIConfig)) {
    super(config)
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeekAPI(prompt: string, systemPrompt: string): Promise<string> {
    const config = this.getCurrentConfig()
    
    try {
      const response = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens || 4000,
          top_p: config.topP || 1.0,
          frequency_penalty: config.frequencyPenalty || 0.0,
          presence_penalty: config.presencePenalty || 0.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`DeepSeek API错误: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`DeepSeek API调用失败: ${error.message}`)
      }
      throw new Error('DeepSeek API调用失败: 未知错误')
    }
  }

  /**
   * 处理DeepSeek特定错误
   */
  private handleDeepSeekError(error: any): string {
    const errorMessage = error.message || error.toString()
    
    if (errorMessage.includes('rate_limit')) {
      return 'API调用频率过高，请稍后重试'
    }
    if (errorMessage.includes('insufficient_quota')) {
      return 'API配额不足，请检查账户余额'
    }
    if (errorMessage.includes('invalid_api_key')) {
      return 'API密钥无效，请检查配置'
    }
    if (errorMessage.includes('model_not_found')) {
      return '指定的模型不存在，请检查模型名称'
    }
    if (errorMessage.includes('context_length_exceeded')) {
      return '输入内容过长，请减少内容长度'
    }
    
    return errorMessage
  }

  /**
   * 带重试的API调用
   */
  private async callWithRetry<T>(
    apiCall: () => Promise<T>, 
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall()
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(this.handleDeepSeekError(error))
        }
        
        // 指数退避
        const waitTime = delay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    throw new Error('重试次数已达上限')
  }

  /**
   * 重写generateContent方法以支持DeepSeek
   */
  protected async generateContent(prompt: string, outputLanguage?: SupportedLanguage): Promise<string> {
    const config = this.getCurrentConfig()
    const language = outputLanguage || 'en'
    const systemPrompt = getLanguageInstruction(language)
    
    if (config.provider === 'deepseek') {
      return this.callWithRetry(() => this.callDeepSeekAPI(prompt, systemPrompt))
    }
    
    // 调用父类方法处理其他提供商
    return super.generateContent(prompt, outputLanguage)
  }

  /**
   * 测试DeepSeek连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const text = await this.generateContent('请回复"连接成功"')
      return text.includes('连接成功') || text.includes('成功')
    } catch (error) {
      console.error('DeepSeek连接测试失败:', error)
      return false
    }
  }
}
