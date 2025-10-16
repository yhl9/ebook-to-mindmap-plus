import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getFictionChapterSummaryPrompt,
  getNonFictionChapterSummaryPrompt,
  getChapterConnectionsAnalysisPrompt,
  getOverallSummaryPrompt,
  getTestConnectionPrompt,
  getChapterMindMapPrompt,
  getMindMapArrowPrompt,
} from './prompts'
import { AIProviderManager } from './aiProviderManager'
import type { MindElixirData } from 'mind-elixir'
import { getLanguageInstruction, type SupportedLanguage } from './prompts/utils'

interface Chapter {
  id: string
  title: string
  content: string
  summary?: string
}

interface AIConfig {
  provider: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'siliconflow' | 'openrouter'
  apiKey: string
  apiUrl?: string // 用于OpenAI兼容的API地址
  model?: string
  temperature?: number
  // DeepSeek特有参数
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export class AIService {
  private config: AIConfig | (() => AIConfig)
  private genAI?: GoogleGenerativeAI
  private model: any

  constructor(config: AIConfig | (() => AIConfig)) {
    this.config = config
    
    const currentConfig = typeof config === 'function' ? config() : config
    console.log('AIService构造函数，接收配置:', currentConfig)
    
    // 使用AIProviderManager获取提供商配置
    const providerConfig = AIProviderManager.getProvider(currentConfig.provider)
    if (!providerConfig) {
      throw new Error(`不支持的AI提供商: ${currentConfig.provider}`)
    }
    
    if (currentConfig.provider === 'gemini') {
      this.genAI = new GoogleGenerativeAI(currentConfig.apiKey)
      this.model = this.genAI.getGenerativeModel({ 
        model: currentConfig.model || 'gemini-1.5-flash'
      })
    } else {
      // 动态配置其他提供商
      this.model = {
        provider: currentConfig.provider,
        apiUrl: currentConfig.apiUrl || providerConfig.apiUrl,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model || providerConfig.models[0]?.id,
        temperature: currentConfig.temperature,
        maxTokens: currentConfig.maxTokens,
        topP: currentConfig.topP,
        frequencyPenalty: currentConfig.frequencyPenalty,
        presencePenalty: currentConfig.presencePenalty
      }
    }
  }

  protected getCurrentConfig(): AIConfig {
    return typeof this.config === 'function' ? this.config() : this.config
  }

  async summarizeChapter(title: string, content: string, bookType: 'fiction' | 'non-fiction' = 'non-fiction', outputLanguage: SupportedLanguage = 'en', customPrompt?: string): Promise<string> {
    try {
      let prompt = bookType === 'fiction'
        ? getFictionChapterSummaryPrompt(title, content)
        : getNonFictionChapterSummaryPrompt(title, content)

      // 如果有自定义提示词，则拼接到原始prompt后面
      if (customPrompt && customPrompt.trim()) {
        prompt += `\n\n补充要求：${customPrompt.trim()}`
      }

      const summary = await this.generateContent(prompt, outputLanguage)

      if (!summary || summary.trim().length === 0) {
        throw new Error('AI返回了空的总结')
      }

      return summary.trim()
    } catch (error) {
      throw new Error(`章节总结失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async analyzeConnections(chapters: Chapter[], outputLanguage: SupportedLanguage = 'en'): Promise<string> {
    try {
      // 构建章节摘要信息
      const chapterSummaries = chapters.map((chapter) => 
        `${chapter.title}:\n${chapter.summary || '无总结'}`
      ).join('\n\n')

      const prompt = getChapterConnectionsAnalysisPrompt(chapterSummaries)

      const connections = await this.generateContent(prompt, outputLanguage)

      if (!connections || connections.trim().length === 0) {
        throw new Error('AI返回了空的关联分析')
      }

      return connections.trim()
    } catch (error) {
      throw new Error(`章节关联分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async generateOverallSummary(
    bookTitle: string, 
    chapters: Chapter[], 
    connections: string,
    outputLanguage: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      // 构建简化的章节信息
      const chapterInfo = chapters.map((chapter, index) => 
        `第${index + 1}章：${chapter.title}，内容：${chapter.summary || '无总结'}`
      ).join('\n')

      const prompt = getOverallSummaryPrompt(bookTitle, chapterInfo, connections)

      const summary = await this.generateContent(prompt, outputLanguage)

      if (!summary || summary.trim().length === 0) {
        throw new Error('AI返回了空的全书总结')
      }

      return summary.trim()
    } catch (error) {
      throw new Error(`全书总结生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async generateChapterMindMap(content: string, outputLanguage: SupportedLanguage = 'en', customPrompt?: string): Promise<MindElixirData> {
    try {
      const basePrompt = getChapterMindMapPrompt()
      let prompt = basePrompt + `章节内容：\n${content}`

      // 如果有自定义提示词，则拼接到原始prompt后面
      if (customPrompt && customPrompt.trim()) {
        prompt += `\n\n补充要求：${customPrompt.trim()}`
      }

      const mindMapJson = await this.generateContent(prompt, outputLanguage)

      if (!mindMapJson || mindMapJson.trim().length === 0) {
        throw new Error('AI返回了空的思维导图数据')
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(mindMapJson.trim())
      } catch (parseError) {
        // 尝试从代码块中提取JSON
        const jsonMatch = mindMapJson.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim())
          } catch (extractError) {
            throw new Error('AI返回的思维导图数据格式不正确')
          }
        }
        throw new Error('AI返回的思维导图数据格式不正确')
      }
    } catch (error) {
      throw new Error(`章节思维导图生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async generateMindMapArrows(combinedMindMapData: any, outputLanguage: SupportedLanguage = 'en'): Promise<any> {
    try {
      const basePrompt = getMindMapArrowPrompt()
      const prompt = basePrompt + `\n\n当前思维导图数据：\n${JSON.stringify(combinedMindMapData, null, 2)}`

      const arrowsJson = await this.generateContent(prompt, outputLanguage)

      if (!arrowsJson || arrowsJson.trim().length === 0) {
        throw new Error('AI返回了空的箭头数据')
      }

      // 尝试解析JSON
      try {
        return JSON.parse(arrowsJson.trim())
      } catch (parseError) {
        // 尝试从代码块中提取JSON
        const jsonMatch = arrowsJson.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim())
          } catch (extractError) {
            throw new Error('AI返回的箭头数据格式不正确')
          }
        }
        throw new Error('AI返回的箭头数据格式不正确')
      }
    } catch (error) {
      throw new Error(`思维导图箭头生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async generateCombinedMindMap(bookTitle: string, chapters: Chapter[], customPrompt?: string): Promise<MindElixirData> {
    try {
      const basePrompt = getChapterMindMapPrompt()
      const chaptersContent = chapters.map(item=>item.content).join('\n\n ------------- \n\n')
      let prompt = `${basePrompt}
        请为整本书《${bookTitle}》生成一个完整的思维导图，将所有章节的内容整合在一起。
        章节内容：\n${chaptersContent}`

      // 如果有自定义提示词，则拼接到原始prompt后面
      if (customPrompt && customPrompt.trim()) {
        prompt += `\n\n补充要求：${customPrompt.trim()}`
      }

      const mindMapJson = await this.generateContent(prompt, 'en')

      if (!mindMapJson || mindMapJson.trim().length === 0) {
        throw new Error('AI返回了空的思维导图数据')
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(mindMapJson.trim())
      } catch (parseError) {
        // 尝试从代码块中提取JSON
        const jsonMatch = mindMapJson.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim())
          } catch (extractError) {
            throw new Error('AI返回的思维导图数据格式不正确')
          }
        }
        throw new Error('AI返回的思维导图数据格式不正确')
      }
    } catch (error) {
      throw new Error(`整书思维导图生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 统一的内容生成方法
  protected async generateContent(prompt: string, outputLanguage?: SupportedLanguage): Promise<string> {
    const config = this.getCurrentConfig()
    const language = outputLanguage || 'en'
    const systemPrompt = getLanguageInstruction(language)
    
    if (config.provider === 'gemini') {
      // Gemini API 不直接支持系统提示，将系统提示合并到用户提示前面
      const finalPrompt = `${prompt}\n\n**${systemPrompt}**`
      const result = await this.model.generateContent(finalPrompt, {
        generationConfig: {
          temperature: config.temperature || 0.7
        }
      })
      const response = await result.response
      return response.text()
    } else if (config.provider === 'openai') {
      const messages: Array<{role: 'system' | 'user', content: string}> = [
        {
          role: 'user',
          content: prompt + '\n\n' + systemPrompt
        }
      ]
      
      const response = await fetch(`${this.model.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.model.apiKey}`
        },
        body: JSON.stringify({
          model: this.model.model,
          messages,
          temperature: config.temperature || 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    } else {
      // 动态处理其他提供商（OpenAI兼容的API）
      const providerConfig = AIProviderManager.getProvider(config.provider)
      if (!providerConfig) {
        throw new Error(`不支持的AI提供商: ${config.provider}`)
      }
      
      console.log(`${config.provider}配置验证:`, {
        provider: config.provider,
        apiUrl: config.apiUrl,
        model: config.model,
        apiKey: config.apiKey ? '已设置' : '未设置'
      })
      
      if (!config.apiKey) {
        throw new Error(`${config.provider} API密钥未设置`)
      }
      if (!config.apiUrl) {
        throw new Error(`${config.provider} API URL未设置`)
      }
      if (!config.model) {
        throw new Error(`${config.provider} 模型未设置`)
      }
      
      // 动态API调用（支持所有OpenAI兼容的API）
      const messages: Array<{role: 'system' | 'user', content: string}> = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ]
      
      const requestUrl = `${config.apiUrl}/chat/completions`
      const requestBody = {
        model: config.model,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 4000,
        top_p: config.topP || 1.0,
        frequency_penalty: config.frequencyPenalty || 0.0,
        presence_penalty: config.presencePenalty || 0.0
      }
      
      console.log(`${config.provider} API请求详情:`, {
        url: requestUrl,
        model: config.model,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : '未设置',
        apiUrl: config.apiUrl,
        fullConfig: {
          provider: config.provider,
          apiUrl: config.apiUrl,
          model: config.model
        }
      })
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`${config.provider} API错误详情:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        if (response.status === 401) {
          throw new Error(`${config.provider} API密钥无效，请检查API密钥配置`)
        } else if (response.status === 404) {
          throw new Error(`${config.provider} API端点不存在，请检查API URL配置`)
        } else if (response.status === 400) {
          throw new Error(`${config.provider} API请求参数错误: ${errorData.error?.message || '请检查模型名称和参数'}`)
        } else {
          throw new Error(`${config.provider} API错误: ${response.status} - ${errorData.error?.message || response.statusText}`)
        }
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    }
    
    throw new Error('不支持的AI提供商')
  }

  // 辅助方法：检查API连接
  async testConnection(): Promise<boolean> {
    try {
      const text = await this.generateContent(getTestConnectionPrompt())
      return text.includes('连接成功') || text.includes('成功')
    } catch (error) {
      return false
    }
  }
}

// 保持向后兼容性
export class GeminiService extends AIService {
  constructor(apiKey: string) {
    super({ provider: 'gemini', apiKey })
  }
}