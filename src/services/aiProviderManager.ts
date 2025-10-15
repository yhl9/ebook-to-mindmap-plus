import aiProvidersConfig from '../config/aiProviders.json'

export interface AIModel {
  id: string
  name: string
  description: string
}

export interface AIParameter {
  type: 'number' | 'string' | 'boolean'
  min?: number
  max?: number
  default: any
  description: string
}

export interface AIProvider {
  name: string
  apiUrl: string
  models: AIModel[]
  parameters: Record<string, AIParameter>
}

export interface AIProvidersConfig {
  providers: Record<string, AIProvider>
}

export class AIProviderManager {
  private static config: AIProvidersConfig = aiProvidersConfig as AIProvidersConfig

  /**
   * 获取所有可用的AI提供商ID列表
   */
  static getProviders(): string[] {
    return Object.keys(this.config.providers)
  }

  /**
   * 获取指定提供商的详细信息
   */
  static getProvider(providerId: string): AIProvider | undefined {
    return this.config.providers[providerId]
  }

  /**
   * 获取指定提供商的所有模型
   */
  static getModels(providerId: string): AIModel[] {
    const provider = this.getProvider(providerId)
    return provider?.models || []
  }

  /**
   * 获取指定提供商的所有参数配置
   */
  static getParameters(providerId: string): Record<string, AIParameter> {
    const provider = this.getProvider(providerId)
    return provider?.parameters || {}
  }

  /**
   * 获取指定提供商的默认配置
   */
  static getDefaultConfig(providerId: string): Record<string, any> {
    const parameters = this.getParameters(providerId)
    const defaults: Record<string, any> = {}
    
    for (const [key, param] of Object.entries(parameters)) {
      defaults[key] = param.default
    }
    
    return defaults
  }

  /**
   * 验证参数值是否有效
   */
  static validateParameter(providerId: string, paramName: string, value: any): boolean {
    const parameters = this.getParameters(providerId)
    const param = parameters[paramName]
    
    if (!param) return false
    
    if (param.type === 'number') {
      const numValue = Number(value)
      if (isNaN(numValue)) return false
      if (param.min !== undefined && numValue < param.min) return false
      if (param.max !== undefined && numValue > param.max) return false
    }
    
    return true
  }

  /**
   * 获取提供商的显示名称
   */
  static getProviderName(providerId: string): string {
    const provider = this.getProvider(providerId)
    return provider?.name || providerId
  }

  /**
   * 获取模型的显示名称
   */
  static getModelName(providerId: string, modelId: string): string {
    const models = this.getModels(providerId)
    const model = models.find(m => m.id === modelId)
    return model?.name || modelId
  }

  /**
   * 获取模型的描述
   */
  static getModelDescription(providerId: string, modelId: string): string {
    const models = this.getModels(providerId)
    const model = models.find(m => m.id === modelId)
    return model?.description || ''
  }

  /**
   * 检查提供商是否存在
   */
  static hasProvider(providerId: string): boolean {
    return providerId in this.config.providers
  }

  /**
   * 检查模型是否存在于指定提供商中
   */
  static hasModel(providerId: string, modelId: string): boolean {
    const models = this.getModels(providerId)
    return models.some(m => m.id === modelId)
  }
}
