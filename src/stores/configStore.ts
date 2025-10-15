import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage } from '../services/prompts/utils'

// AI配置接口
export interface AIConfig {
  provider: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'siliconflow' | 'openrouter'
  apiKey: string
  apiUrl: string
  model: string
  temperature: number
  // 通用参数
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

// 处理选项接口
interface ProcessingOptions {
  processingMode: 'summary' | 'mindmap' | 'combined-mindmap'
  bookType: 'fiction' | 'non-fiction'
  useSmartDetection: boolean
  skipNonEssentialChapters: boolean
  maxSubChapterDepth: number
  outputLanguage: SupportedLanguage
}

// 配置store状态接口
interface ConfigState {
  // AI配置
  aiConfig: AIConfig
  setAiProvider: (provider: 'gemini' | 'openai' | 'deepseek') => void
  setApiKey: (apiKey: string) => void
  setApiUrl: (apiUrl: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  
  // DeepSeek特有配置方法
  setMaxTokens: (maxTokens: number) => void
  setTopP: (topP: number) => void
  setFrequencyPenalty: (penalty: number) => void
  setPresencePenalty: (penalty: number) => void
  
  // 处理选项
  processingOptions: ProcessingOptions
  setProcessingMode: (mode: 'summary' | 'mindmap' | 'combined-mindmap') => void
  setBookType: (type: 'fiction' | 'non-fiction') => void
  setUseSmartDetection: (enabled: boolean) => void
  setSkipNonEssentialChapters: (enabled: boolean) => void
  setMaxSubChapterDepth: (depth: number) => void
  setOutputLanguage: (language: SupportedLanguage) => void
}

// 默认配置
const defaultAIConfig: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  apiUrl: 'https://api.openai.com/v1',
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  // DeepSeek默认参数
  maxTokens: 4000,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0
}


const defaultProcessingOptions: ProcessingOptions = {
  processingMode: 'mindmap',
  bookType: 'non-fiction',
  useSmartDetection: false,
  skipNonEssentialChapters: true,
  maxSubChapterDepth: 0,
  outputLanguage: 'en'
}

// 创建配置store
export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      // AI配置
      aiConfig: defaultAIConfig,
      setAiProvider: (provider) => set((state) => ({
        aiConfig: { ...state.aiConfig, provider }
      })),
      setApiKey: (apiKey) => set((state) => ({
        aiConfig: { ...state.aiConfig, apiKey }
      })),
      setApiUrl: (apiUrl) => set((state) => ({
        aiConfig: { ...state.aiConfig, apiUrl }
      })),
      setModel: (model) => set((state) => ({
        aiConfig: { ...state.aiConfig, model }
      })),
      setTemperature: (temperature) => set((state) => ({
        aiConfig: { ...state.aiConfig, temperature }
      })),
      
      // DeepSeek特有配置方法
      setMaxTokens: (maxTokens) => set((state) => ({
        aiConfig: { ...state.aiConfig, maxTokens }
      })),
      setTopP: (topP) => set((state) => ({
        aiConfig: { ...state.aiConfig, topP }
      })),
      setFrequencyPenalty: (frequencyPenalty) => set((state) => ({
        aiConfig: { ...state.aiConfig, frequencyPenalty }
      })),
      setPresencePenalty: (presencePenalty) => set((state) => ({
        aiConfig: { ...state.aiConfig, presencePenalty }
      })),
      
      // 处理选项
      processingOptions: defaultProcessingOptions,
      setProcessingMode: (processingMode) => set((state) => ({
        processingOptions: { ...state.processingOptions, processingMode }
      })),
      setBookType: (bookType) => set((state) => ({
        processingOptions: { ...state.processingOptions, bookType }
      })),
      setUseSmartDetection: (useSmartDetection) => set((state) => ({
        processingOptions: { ...state.processingOptions, useSmartDetection }
      })),
      setSkipNonEssentialChapters: (skipNonEssentialChapters) => set((state) => ({
        processingOptions: { ...state.processingOptions, skipNonEssentialChapters }
      })),
      setMaxSubChapterDepth: (maxSubChapterDepth) => set((state) => ({
        processingOptions: { ...state.processingOptions, maxSubChapterDepth }
      })),
      setOutputLanguage: (outputLanguage) => set((state) => ({
        processingOptions: { ...state.processingOptions, outputLanguage }
      }))
    }),
    {
      name: 'ebook-mindmap-config', // localStorage中的键名
      partialize: (state) => ({
        aiConfig: state.aiConfig,
        processingOptions: state.processingOptions
      })
    }
  )
)

// 导出便捷的选择器
export const useAIConfig = () => useConfigStore((state) => state.aiConfig)
export const useProcessingOptions = () => useConfigStore((state) => state.processingOptions)