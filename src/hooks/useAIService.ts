import { useConfigStore } from '../stores/configStore'
import { AIServiceFactory } from '../services/aiServiceFactory'
import { useMemo } from 'react'

export function useAIService() {
  const aiConfig = useConfigStore(state => state.aiConfig)
  
  const aiService = useMemo(() => {
    console.log('创建AI服务，配置:', aiConfig)
    return AIServiceFactory.createService(aiConfig)
  }, [aiConfig])
  
  return aiService
}
