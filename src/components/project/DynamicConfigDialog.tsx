import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConfigStore } from '../../stores/configStore'
import { AIProviderManager } from '../../services/aiProviderManager'
import { Settings } from 'lucide-react'

interface DynamicConfigDialogProps {
  processing: boolean
}

export function DynamicConfigDialog({ processing }: DynamicConfigDialogProps) {
  const {
    aiConfig,
    setAiProvider,
    setApiKey,
    setApiUrl,
    setModel,
    setTemperature,
    setMaxTokens,
    setTopP,
    setFrequencyPenalty,
    setPresencePenalty
  } = useConfigStore()

  const { provider, apiKey, apiUrl, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty } = aiConfig

  const providers = AIProviderManager.getProviders()
  const currentProvider = AIProviderManager.getProvider(provider)
  const models = AIProviderManager.getModels(provider)
  const parameters = AIProviderManager.getParameters(provider)

  const handleProviderChange = (newProvider: string) => {
    console.log('切换AI提供商到:', newProvider)
    setAiProvider(newProvider as any)
    
    const providerConfig = AIProviderManager.getProvider(newProvider)
    if (providerConfig) {
      setApiUrl(providerConfig.apiUrl)
      setModel(providerConfig.models[0]?.id || '')
      
      // 设置默认参数
      const defaults = AIProviderManager.getDefaultConfig(newProvider)
      Object.entries(defaults).forEach(([key, value]) => {
        switch (key) {
          case 'temperature':
            setTemperature(value)
            break
          case 'maxTokens':
            setMaxTokens(value)
            break
          case 'topP':
            setTopP(value)
            break
          case 'frequencyPenalty':
            setFrequencyPenalty(value)
            break
          case 'presencePenalty':
            setPresencePenalty(value)
            break
        }
      })
      
      console.log('设置默认配置:', {
        apiUrl: providerConfig.apiUrl,
        model: providerConfig.models[0]?.id,
        defaults
      })
    }
  }

  const renderParameterInput = (paramName: string, paramConfig: any) => {
    const value = aiConfig[paramName as keyof typeof aiConfig] || paramConfig.default

    switch (paramConfig.type) {
      case 'number':
        return (
          <Input
            type="number"
            min={paramConfig.min}
            max={paramConfig.max}
            step="0.1"
            value={value}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || paramConfig.default
              switch (paramName) {
                case 'temperature':
                  setTemperature(newValue)
                  break
                case 'maxTokens':
                  setMaxTokens(newValue)
                  break
                case 'topP':
                  setTopP(newValue)
                  break
                case 'frequencyPenalty':
                  setFrequencyPenalty(newValue)
                  break
                case 'presencePenalty':
                  setPresencePenalty(newValue)
                  break
              }
            }}
            disabled={processing}
          />
        )
      case 'string':
        return (
          <Input
            value={value}
            onChange={(e) => {
              switch (paramName) {
                case 'apiKey':
                  setApiKey(e.target.value)
                  break
                case 'apiUrl':
                  setApiUrl(e.target.value)
                  break
                case 'model':
                  setModel(e.target.value)
                  break
              }
            }}
            disabled={processing}
          />
        )
      default:
        return null
    }
  }

  const getParameterLabel = (paramName: string): string => {
    const labels: Record<string, string> = {
      temperature: '温度',
      maxTokens: '最大Token数',
      topP: 'Top P',
      frequencyPenalty: '频率惩罚',
      presencePenalty: '存在惩罚'
    }
    return labels[paramName] || paramName
  }

  const getParameterDescription = (paramName: string, paramConfig: any): string => {
    if (paramConfig.description) {
      return paramConfig.description
    }
    
    const descriptions: Record<string, string> = {
      temperature: `控制输出的随机性 (${paramConfig.min}-${paramConfig.max})`,
      maxTokens: `控制生成内容的最大长度 (${paramConfig.min}-${paramConfig.max})`,
      topP: `控制生成内容的多样性 (${paramConfig.min}-${paramConfig.max})`,
      frequencyPenalty: `减少重复内容 (${paramConfig.min}到${paramConfig.max})`,
      presencePenalty: `鼓励新话题 (${paramConfig.min}到${paramConfig.max})`
    }
    return descriptions[paramName] || ''
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={processing} className="text-lg font-bold">
          <Settings className="h-5 w-5 mr-2" />
          配置
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI服务配置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* AI提供商选择 */}
          <div className="space-y-2">
            <Label htmlFor="ai-provider">AI提供商</Label>
            <Select value={provider} onValueChange={handleProviderChange} disabled={processing}>
              <SelectTrigger>
                <SelectValue placeholder="选择AI提供商" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((providerId) => {
                  const providerInfo = AIProviderManager.getProvider(providerId)
                  return (
                    <SelectItem key={providerId} value={providerId}>
                      {providerInfo?.name || providerId}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* API密钥 */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API密钥</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="输入API密钥"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={processing}
            />
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              type="url"
              placeholder={currentProvider?.apiUrl}
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={processing}
            />
          </div>

          {/* 模型选择 */}
          <div className="space-y-2">
            <Label htmlFor="model">模型</Label>
            <Select value={model} onValueChange={setModel} disabled={processing}>
              <SelectTrigger>
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {models.map((modelInfo) => (
                  <SelectItem key={modelInfo.id} value={modelInfo.id}>
                    <div>
                      <div className="font-medium">{modelInfo.name}</div>
                      <div className="text-sm text-gray-500">{modelInfo.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 动态参数 */}
          {Object.entries(parameters).map(([paramName, paramConfig]) => (
            <div key={paramName} className="space-y-2">
              <Label htmlFor={paramName}>
                {getParameterLabel(paramName)}
              </Label>
              {renderParameterInput(paramName, paramConfig)}
              <p className="text-xs text-gray-600">
                {getParameterDescription(paramName, paramConfig)}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
