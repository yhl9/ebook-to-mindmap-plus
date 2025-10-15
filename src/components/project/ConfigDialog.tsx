import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConfigStore, useAIConfig, useProcessingOptions } from '../../stores/configStore'
import type { SupportedLanguage } from '../../services/prompts/utils'

interface ConfigDialogProps {
  processing: boolean
  file: File | null
}

export function ConfigDialog({ processing }: ConfigDialogProps) {
  const { t } = useTranslation()
  // 使用zustand store管理配置
  const aiConfig = useAIConfig()
  const processingOptions = useProcessingOptions()
  const {
    setAiProvider,
    setApiKey,
    setApiUrl,
    setModel,
    setTemperature,
    setMaxTokens,
    setTopP,
    setFrequencyPenalty,
    setPresencePenalty,
    setProcessingMode,
    setBookType,
    setUseSmartDetection,
    setSkipNonEssentialChapters,
    setOutputLanguage
  } = useConfigStore()

  // 处理提供商切换时的默认值更新
  const handleProviderChange = (newProvider: 'gemini' | 'openai' | 'deepseek') => {
    console.log('切换AI提供商到:', newProvider)
    setAiProvider(newProvider)
    
    // 当切换到DeepSeek时，设置正确的默认值
    if (newProvider === 'deepseek') {
      console.log('设置DeepSeek默认配置...')
      setApiUrl('https://api.deepseek.com')
      setModel('deepseek-chat')
      setMaxTokens(4000)
      setTopP(1.0)
      setFrequencyPenalty(0.0)
      setPresencePenalty(0.0)
      console.log('DeepSeek配置已设置:', {
        apiUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        maxTokens: 4000
      })
    }
  }

  // 处理模型切换时的默认值更新
  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    // 根据模型类型设置默认的maxTokens
    if (newModel === 'deepseek-reasoner') {
      setMaxTokens(32000)
    } else if (newModel === 'deepseek-chat') {
      setMaxTokens(4000)
    }
  }

  // 从store中解构状态值
  const { provider: aiProvider, apiKey, apiUrl, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty } = aiConfig
  const { processingMode, bookType, useSmartDetection, skipNonEssentialChapters, outputLanguage } = processingOptions

  // 调试：显示当前配置
  console.log('当前AI配置:', {
    provider: aiProvider,
    apiUrl: apiUrl,
    model: model,
    apiKey: apiKey ? '已设置' : '未设置'
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={processing}
          className="flex items-center gap-1"
        >
          <Settings className="h-3.5 w-3.5" />
          {t('config.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('config.aiServiceConfig')}
          </DialogTitle>
          <DialogDescription>
            {t('config.description')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* AI 服务配置 */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4" />
                <Label className="text-sm font-medium">{t('config.aiServiceConfig')}</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">{t('config.aiProvider')}</Label>
                  <Select value={aiProvider} onValueChange={handleProviderChange} disabled={processing}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('config.selectAiProvider')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openai">{t('config.openaiCompatible')}</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apikey">
                    {aiProvider === 'gemini' ? 'Gemini API Key' : aiProvider === 'deepseek' ? 'DeepSeek API Key' : 'API Token'}
                  </Label>
                  <Input
                    id="apikey"
                    type="password"
                    placeholder={aiProvider === 'gemini' ? t('config.enterGeminiApiKey') : aiProvider === 'deepseek' ? 'Enter DeepSeek API Key' : t('config.enterApiToken')}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={processing}
                  />
                </div>
              </div>

              {aiProvider === 'openai' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-url">{t('config.apiUrl')}</Label>
                      <Input
                        id="api-url"
                        type="url"
                        placeholder="https://api.openai.com/v1"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        disabled={processing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">{t('config.modelName')}</Label>
                      <Input
                        id="model"
                        type="text"
                        placeholder={t('config.modelPlaceholder')}
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={processing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openai-temperature">{t('config.temperature')}</Label>
                    <Input
                      id="openai-temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      placeholder="0.7"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      disabled={processing}
                    />
                    <p className="text-xs text-gray-600">
                      {t('config.temperatureDescription')}
                    </p>
                  </div>
                </>
              )}

              {aiProvider === 'deepseek' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deepseek-api-url">API URL</Label>
                      <Input
                        id="deepseek-api-url"
                        type="url"
                        placeholder="https://api.deepseek.com"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        disabled={processing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deepseek-model">Model Name</Label>
                      <Select value={model} onValueChange={handleModelChange} disabled={processing}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择模型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deepseek-chat">deepseek-chat (标准模式)</SelectItem>
                          <SelectItem value="deepseek-reasoner">deepseek-reasoner (思考模式)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-600">
                        <strong>deepseek-chat:</strong> 标准对话模式，支持Function Calling、JSON Output<br/>
                        <strong>deepseek-reasoner:</strong> 思考模式，更强的推理能力，输出长度更大
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deepseek-temperature">Temperature</Label>
                      <Input
                        id="deepseek-temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        placeholder="0.7"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                        disabled={processing}
                      />
                      <p className="text-xs text-gray-600">
                        {t('config.temperatureDescription')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deepseek-max-tokens">Max Tokens</Label>
                      <Input
                        id="deepseek-max-tokens"
                        type="number"
                        min="1"
                        max={model === 'deepseek-reasoner' ? 64000 : 8000}
                        placeholder={model === 'deepseek-reasoner' ? '32000' : '4000'}
                        value={maxTokens || (model === 'deepseek-reasoner' ? 32000 : 4000)}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value) || (model === 'deepseek-reasoner' ? 32000 : 4000))}
                        disabled={processing}
                      />
                      <p className="text-xs text-gray-600">
                        {model === 'deepseek-reasoner' 
                          ? '控制生成内容的最大长度 (1-64000，默认32000)'
                          : '控制生成内容的最大长度 (1-8000，默认4000)'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deepseek-top-p">Top P</Label>
                      <Input
                        id="deepseek-top-p"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        placeholder="1.0"
                        value={topP || 1.0}
                        onChange={(e) => setTopP(parseFloat(e.target.value) || 1.0)}
                        disabled={processing}
                      />
                      <p className="text-xs text-gray-600">
                        控制生成内容的多样性 (0-1)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deepseek-frequency-penalty">Frequency Penalty</Label>
                      <Input
                        id="deepseek-frequency-penalty"
                        type="number"
                        step="0.1"
                        min="-2"
                        max="2"
                        placeholder="0.0"
                        value={frequencyPenalty || 0.0}
                        onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value) || 0.0)}
                        disabled={processing}
                      />
                      <p className="text-xs text-gray-600">
                        减少重复内容 (-2到2)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deepseek-presence-penalty">Presence Penalty</Label>
                    <Input
                      id="deepseek-presence-penalty"
                      type="number"
                      step="0.1"
                      min="-2"
                      max="2"
                      placeholder="0.0"
                      value={presencePenalty || 0.0}
                      onChange={(e) => setPresencePenalty(parseFloat(e.target.value) || 0.0)}
                      disabled={processing}
                    />
                    <p className="text-xs text-gray-600">
                      鼓励新话题 (-2到2)
                    </p>
                  </div>
                </>
              )}

              {aiProvider === 'gemini' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gemini-model">{t('config.modelName')}</Label>
                    <Input
                      id="gemini-model"
                      type="text"
                      placeholder={t('config.geminiModelPlaceholder')}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={processing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemini-temperature">{t('config.temperature')}</Label>
                    <Input
                      id="gemini-temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      placeholder="0.7"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                      disabled={processing}
                    />
                    <p className="text-xs text-gray-600">
                      {t('config.temperatureDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="processing-mode" className="text-sm font-medium">
                    {t('config.processingMode')}
                  </Label>
                  <Select value={processingMode} onValueChange={(value: 'summary' | 'mindmap' | 'combined-mindmap') => setProcessingMode(value)} disabled={processing}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('config.selectProcessingMode')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">{t('config.summaryMode')}</SelectItem>
                      <SelectItem value="mindmap">{t('config.mindmapMode')}</SelectItem>
                      <SelectItem value="combined-mindmap">{t('config.combinedMindmapMode')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    {t('config.processingModeDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="book-type" className="text-sm font-medium">
                    {t('config.bookType')}
                  </Label>
                  <Select value={bookType} onValueChange={(value: 'fiction' | 'non-fiction') => setBookType(value)} disabled={processing}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('config.selectBookType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non-fiction">{t('config.socialType')}</SelectItem>
                      <SelectItem value="fiction">{t('config.novelType')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">
                    {t('config.bookTypeDescription', { type: processingMode === 'summary' ? t('config.summary') : t('config.mindmap') })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
              <div className="space-y-1">
                <Label htmlFor="smart-detection" className="text-sm font-medium">
                  {t('config.smartChapterDetection')}
                </Label>
                <p className="text-xs text-gray-600">
                  {t('config.smartChapterDetectionDescription')}
                </p>
              </div>
              <Switch
                id="smart-detection"
                checked={useSmartDetection}
                onCheckedChange={setUseSmartDetection}
                disabled={processing}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
              <div className="space-y-1">
                <Label htmlFor="skip-non-essential" className="text-sm font-medium">
                  {t('config.skipIrrelevantChapters')}
                </Label>
                <p className="text-xs text-gray-600">
                  {t('config.skipIrrelevantChaptersDescription')}
                </p>
              </div>
              <Switch
                id="skip-non-essential"
                checked={skipNonEssentialChapters}
                onCheckedChange={setSkipNonEssentialChapters}
                disabled={processing}
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="max-sub-chapter-depth" className="text-sm font-medium">
                  {t('config.recursionDepth')}
                </Label>
                <Select
                  value={processingOptions.maxSubChapterDepth?.toString()}
                  onValueChange={(value) => useConfigStore.getState().setMaxSubChapterDepth(parseInt(value))}
                  disabled={processing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('config.selectRecursionDepth')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('config.noRecursion')}</SelectItem>
                    <SelectItem value="1">{t('config.recursion1Layer')}</SelectItem>
                    <SelectItem value="2">{t('config.recursion2Layers')}</SelectItem>
                    <SelectItem value="3">{t('config.recursion3Layers')}</SelectItem>
                    <SelectItem value="4">{t('config.recursion4Layers')}</SelectItem>
                    <SelectItem value="5">{t('config.recursion5Layers')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  {t('config.recursionDepthDescription')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="output-language" className="text-sm font-medium">
                  {t('config.outputLanguage')}
                </Label>
                <Select value={outputLanguage} onValueChange={(value: SupportedLanguage) => setOutputLanguage(value)} disabled={processing}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('config.selectOutputLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{t('config.outputLanguageAuto')}</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  {t('config.outputLanguageDescription')}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}