import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Upload, BookOpen, Brain, FileText, Loader2, Network, Trash2, List, ChevronUp, Globe } from 'lucide-react'
import { EpubProcessor, type ChapterData } from './services/epubProcessor'
import { PdfProcessor } from './services/pdfProcessor'
import { WordProcessor } from './services/wordProcessor'
import { HtmlProcessor } from './services/htmlProcessor'
import { WebContentProcessor } from './services/webContentProcessor'
import { TextContentProcessor } from './services/textContentProcessor'
import { AIService } from './services/geminiService'
import { CacheService } from './services/cacheService'
import { DynamicConfigDialog } from './components/project/DynamicConfigDialog'
import type { MindElixirData } from 'mind-elixir'
import type { Summary } from 'node_modules/mind-elixir/dist/types/summary'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { MarkdownCard } from './components/MarkdownCard'
import { MindMapCard } from './components/MindMapCard'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { scrollToTop, openInMindElixir, downloadMindMap } from './utils'


const options = { direction: 1, alignment: 'nodes' } as const

interface Chapter {
  id: string
  title: string
  content: string
  summary?: string
  mindMap?: MindElixirData
  processed: boolean
}

interface BookSummary {
  title: string
  author: string
  chapters: Chapter[]
  connections: string
  overallSummary: string
}

interface BookMindMap {
  title: string
  author: string
  chapters: Chapter[]
  combinedMindMap: MindElixirData | null
}

// 导入配置store
import { useAIConfig, useProcessingOptions, useConfigStore } from './stores/configStore'
const cacheService = new CacheService()

function App() {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [webUrl, setWebUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'url' | 'text'>('file')
  const [webProcessing, setWebProcessing] = useState(false)
  const [textProcessing, setTextProcessing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [extractingChapters, setExtractingChapters] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [bookSummary, setBookSummary] = useState<BookSummary | null>(null)
  const [bookMindMap, setBookMindMap] = useState<BookMindMap | null>(null)
  const [extractedChapters, setExtractedChapters] = useState<ChapterData[] | null>(null)
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set())
  const [bookData, setBookData] = useState<{ title: string; author: string } | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)



  // 使用zustand store管理配置
  const aiConfig = useAIConfig()
  const processingOptions = useProcessingOptions()

  // 从store中解构状态值
  const { apiKey } = aiConfig
  const { processingMode, bookType, useSmartDetection, skipNonEssentialChapters } = processingOptions

  // zustand的persist中间件会自动处理配置的加载和保存

  // 监听滚动事件，控制回到顶部按钮显示
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && (selectedFile.name.endsWith('.epub') || selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm'))) {
      setFile(selectedFile)
      setWebUrl('') // 清空URL输入
      setInputMode('file')
      // 重置章节提取状态
      setExtractedChapters(null)
      setSelectedChapters(new Set())
      setBookData(null)
      setBookSummary(null)
      setBookMindMap(null)
    } else {
      toast.error(t('upload.invalidFile'), {
        duration: 3000,
        position: 'top-center',
      })
    }
  }, [t])

  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value
    setWebUrl(url)
    if (url.trim()) {
      setFile(null) // 清空文件选择
      setInputMode('url')
      // 重置章节提取状态
      setExtractedChapters(null)
      setSelectedChapters(new Set())
      setBookData(null)
      setBookSummary(null)
      setBookMindMap(null)
    }
  }, [])

  const handleInputModeChange = useCallback((mode: 'file' | 'url' | 'text') => {
    setInputMode(mode)
    if (mode === 'file') {
      setWebUrl('')
      setTextContent('')
    } else if (mode === 'url') {
      setFile(null)
      setTextContent('')
    } else if (mode === 'text') {
      setFile(null)
      setWebUrl('')
    }
    // 重置章节提取状态
    setExtractedChapters(null)
    setSelectedChapters(new Set())
    setBookData(null)
    setBookSummary(null)
    setBookMindMap(null)
  }, [])

  // 清除章节缓存的函数
  const clearChapterCache = (chapterId: string) => {
    const cacheKey = inputMode === 'file' ? file?.name : 
                     inputMode === 'url' ? webUrl : 
                     inputMode === 'text' ? `text_${textContent.substring(0, 50)}` : null
    if (!cacheKey) return

    const type = processingMode === 'summary' ? 'summary' : 'mindmap'
    if (cacheService.clearChapterCache(cacheKey, chapterId, type)) {
      toast.success('已清除缓存，下次处理将重新生成内容', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  // 清除特定类型缓存的函数
  const clearSpecificCache = (cacheType: 'connections' | 'overall_summary' | 'combined_mindmap' | 'merged_mindmap') => {
    const cacheKey = inputMode === 'file' ? file?.name : 
                     inputMode === 'url' ? webUrl : 
                     inputMode === 'text' ? `text_${textContent.substring(0, 50)}` : null
    if (!cacheKey) return

    const displayNames = {
      connections: '章节关联',
      overall_summary: '全书总结',
      combined_mindmap: '整书思维导图',
      merged_mindmap: '章节思维导图整合'
    }

    if (cacheService.clearSpecificCache(cacheKey, cacheType)) {
      toast.success(`已清除${displayNames[cacheType]}缓存，下次处理将重新生成内容`, {
        duration: 3000,
        position: 'top-center',
      })
    } else {
      toast.info(`没有找到可清除的${displayNames[cacheType]}缓存`, {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  // 章节选择处理函数
  const handleChapterSelect = useCallback((chapterId: string, checked: boolean) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(chapterId)
      } else {
        newSet.delete(chapterId)
      }
      return newSet
    })
  }, [])

  // 全选/取消全选处理函数
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!extractedChapters) return

    if (checked) {
      setSelectedChapters(new Set(extractedChapters.map(chapter => chapter.id)))
    } else {
      setSelectedChapters(new Set())
    }
  }, [extractedChapters])

  // 清除整本书缓存的函数
  const clearBookCache = () => {
    const cacheKey = inputMode === 'file' ? file?.name : 
                     inputMode === 'url' ? webUrl : 
                     inputMode === 'text' ? `text_${textContent.substring(0, 50)}` : null
    if (!cacheKey) return

    const mode = processingMode === 'combined-mindmap' ? 'combined_mindmap' : processingMode as 'summary' | 'mindmap'
    const deletedCount = cacheService.clearBookCache(cacheKey, mode)

    const modeNames = {
      'summary': '文字总结',
      'mindmap': '章节思维导图',
      'combined-mindmap': '整书思维导图'
    }

    if (deletedCount > 0) {
      toast.success(`已清除${deletedCount}项${modeNames[processingMode]}缓存，下次处理将重新生成内容`, {
        duration: 3000,
        position: 'top-center',
      })
    } else {
      toast.info(`没有找到可清除的${modeNames[processingMode]}缓存`, {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  // 专门的网页地址处理函数
  const handleWebUrlExtract = useCallback(async () => {
    if (!webUrl.trim()) {
      toast.error(t('upload.pleaseEnterUrl'), {
        duration: 3000,
        position: 'top-center',
      })
      return
    }

    setWebProcessing(true)
    setProgress(0)
    setCurrentStep('')

    try {
      const processor = new WebContentProcessor()
      setCurrentStep('正在获取网页内容...')
      const bookData = await processor.parseWebContent(webUrl)
      setProgress(50)

      setCurrentStep('正在提取章节内容...')
      const chapters = await processor.extractChapters(webUrl, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth)
      setProgress(100)

      setBookData({ title: bookData.title, author: bookData.author })
      setExtractedChapters(chapters)
      // 默认选中所有章节
      setSelectedChapters(new Set(chapters.map(chapter => chapter.id)))
      setCurrentStep(`网页章节提取完成！共提取到 ${chapters.length} 个章节`)

      toast.success(`成功提取 ${chapters.length} 个章节`, {
        duration: 3000,
        position: 'top-center',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('progress.extractionError'), {
        duration: 5000,
        position: 'top-center',
      })
    } finally {
      setWebProcessing(false)
    }
  }, [webUrl, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth, t])

  // 文本内容处理函数
  const handleTextExtract = useCallback(async () => {
    if (!textContent.trim()) {
      toast.error(t('upload.pleaseEnterText'), {
        duration: 3000,
        position: 'top-center',
      })
      return
    }

    if (textContent.length > 2000) {
      toast.error(t('upload.textTooLong'), {
        duration: 3000,
        position: 'top-center',
      })
      return
    }

    setTextProcessing(true)
    setProgress(0)
    setCurrentStep('')

    try {
      setCurrentStep('正在分析文本内容...')
      setProgress(50)

      // 创建文本处理器
      const processor = new TextContentProcessor()
      const bookData = await processor.parseText(textContent)
      
      setCurrentStep('正在提取章节内容...')
      const chapters = await processor.extractChapters(textContent, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth)
      setProgress(100)

      setBookData({ title: bookData.title, author: bookData.author })
      setExtractedChapters(chapters)
      // 默认选中所有章节
      setSelectedChapters(new Set(chapters.map(chapter => chapter.id)))
      setCurrentStep(`文本章节提取完成！共提取到 ${chapters.length} 个章节`)

      toast.success(`成功提取 ${chapters.length} 个章节`, {
        duration: 3000,
        position: 'top-center',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('progress.extractionError'), {
        duration: 5000,
        position: 'top-center',
      })
    } finally {
      setTextProcessing(false)
    }
  }, [textContent, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth, t])

  // 文件章节提取函数
  const extractFileChapters = useCallback(async () => {
    if (!file) {
      toast.error(t('upload.pleaseSelectFile'), {
        duration: 3000,
        position: 'top-center',
      })
      return
    }

    setExtractingChapters(true)
    setProgress(0)
    setCurrentStep('')

    try {
      let extractedBookData: { title: string; author: string }
      let chapters: ChapterData[]

      // 处理文件输入
      const isEpub = file!.name.endsWith('.epub')
      const isPdf = file!.name.endsWith('.pdf')
      const isWord = file!.name.endsWith('.docx') || file!.name.endsWith('.doc')
      const isHtml = file!.name.endsWith('.html') || file!.name.endsWith('.htm')

      if (isEpub) {
        const processor = new EpubProcessor()
        setCurrentStep('正在解析 EPUB 文件...')
        const bookData = await processor.parseEpub(file!)
        extractedBookData = { title: bookData.title, author: bookData.author }
        setProgress(50)

        setCurrentStep('正在提取章节内容...')
        chapters = await processor.extractChapters(bookData.book, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth)
      } else if (isPdf) {
        const processor = new PdfProcessor()
        setCurrentStep('正在解析 PDF 文件...')
        const bookData = await processor.parsePdf(file!)
        extractedBookData = { title: bookData.title, author: bookData.author }
        setProgress(50)

        setCurrentStep('正在提取章节内容...')
        chapters = await processor.extractChapters(file!, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth)
      } else if (isWord) {
        const processor = new WordProcessor()
        setCurrentStep('正在解析 Word 文件...')
        const bookData = await processor.parseWord(file!)
        extractedBookData = { title: bookData.title, author: bookData.author }
        setProgress(50)

        setCurrentStep('正在提取章节内容...')
        chapters = await processor.extractChapters(file!, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth)
      } else if (isHtml) {
        const processor = new HtmlProcessor()
        setCurrentStep('正在解析 HTML 文件...')
        const bookData = await processor.parseHtml(file!)
        extractedBookData = { title: bookData.title, author: bookData.author }
        setProgress(50)

        setCurrentStep('正在提取章节内容...')
        chapters = await processor.extractChapters(file!, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth)
      } else {
        throw new Error('不支持的文件格式')
      }
      setProgress(100)

      setBookData(extractedBookData)
      setExtractedChapters(chapters)
      // 默认选中所有章节
      setSelectedChapters(new Set(chapters.map(chapter => chapter.id)))
      setCurrentStep(`章节提取完成！共提取到 ${chapters.length} 个章节`)

      toast.success(`成功提取 ${chapters.length} 个章节`, {
        duration: 3000,
        position: 'top-center',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('progress.extractionError'), {
        duration: 5000,
        position: 'top-center',
      })
    } finally {
      setExtractingChapters(false)
    }
  }, [file, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth, t])

  const processEbook = useCallback(async () => {
    if (!extractedChapters || !bookData || !apiKey) {
      toast.error(t('chapters.extractAndApiKey'), {
        duration: 3000,
        position: 'top-center',
      })
      return
    }
    const cacheKey = inputMode === 'file' ? file?.name : 
                     inputMode === 'url' ? webUrl : 
                     inputMode === 'text' ? `text_${textContent.substring(0, 50)}` : null
    if (!cacheKey) return

    if (selectedChapters.size === 0) {
      toast.error(t('chapters.selectAtLeastOne'), {
        duration: 3000,
        position: 'top-center',
      })
      return
    }

    // 开始新任务时清空上次显示的内容
    setBookSummary(null)
    setBookMindMap(null)
    setProcessing(true)
    setProgress(0)
    setCurrentStep('')

    try {
      const aiService = new AIService(() => {
        const currentState = useConfigStore.getState()
        const currentAiConfig = currentState.aiConfig
        console.log('App.tsx中创建AIService，配置:', currentAiConfig)
        return {
          provider: currentAiConfig.provider,
          apiKey: currentAiConfig.apiKey,
          apiUrl: currentAiConfig.apiUrl,
          model: currentAiConfig.model || undefined,
          temperature: currentAiConfig.temperature,
          maxTokens: currentAiConfig.maxTokens,
          topP: currentAiConfig.topP,
          frequencyPenalty: currentAiConfig.frequencyPenalty,
          presencePenalty: currentAiConfig.presencePenalty
        }
      })

      // 只处理选中的章节
      const chapters = extractedChapters.filter(chapter => selectedChapters.has(chapter.id))

      const totalChapters = chapters.length
      const processedChapters: Chapter[] = []

      // 根据模式初始化状态
      if (processingMode === 'summary') {
        setBookSummary({
          title: bookData.title,
          author: bookData.author,
          chapters: [],
          connections: '',
          overallSummary: ''
        })
      } else if (processingMode === 'mindmap' || processingMode === 'combined-mindmap') {
        setBookMindMap({
          title: bookData.title,
          author: bookData.author,
          chapters: [],
          combinedMindMap: null
        })
      }

      // 步骤3: 逐章处理
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i]
        setCurrentStep(`正在处理第 ${i + 1}/${totalChapters} 章: ${chapter.title}`)

        let processedChapter: Chapter

        if (processingMode === 'summary') {
          // 文字总结模式
          let summary = cacheService.getString(cacheKey, 'summary', chapter.id)

          if (!summary) {
            summary = await aiService.summarizeChapter(chapter.title, chapter.content, bookType, processingOptions.outputLanguage, customPrompt)
            cacheService.setCache(cacheKey, 'summary', summary, chapter.id)
          }

          processedChapter = {
            ...chapter,
            summary,
            processed: true
          }

          processedChapters.push(processedChapter)

          setBookSummary(prevSummary => ({
            ...prevSummary!,
            chapters: [...processedChapters]
          }))
        } else if (processingMode === 'mindmap') {
          // 章节思维导图模式
          let mindMap = cacheService.getMindMap(cacheKey, 'mindmap', chapter.id)

          if (!mindMap) {
            mindMap = await aiService.generateChapterMindMap(chapter.content, processingOptions.outputLanguage, customPrompt)
            cacheService.setCache(cacheKey, 'mindmap', mindMap, chapter.id)
          }

          if (!mindMap.nodeData) continue // 无需总结的章节
          processedChapter = {
            ...chapter,
            mindMap,
            processed: true
          }

          processedChapters.push(processedChapter)

          setBookMindMap(prevMindMap => ({
            ...prevMindMap!,
            chapters: [...processedChapters]
          }))
        } else if (processingMode === 'combined-mindmap') {
          // 整书思维导图模式 - 只收集章节内容，不生成单独的思维导图
          processedChapter = {
            ...chapter,
            processed: true
          }

          processedChapters.push(processedChapter)

          setBookMindMap(prevMindMap => ({
            ...prevMindMap!,
            chapters: [...processedChapters]
          }))
        }

        setProgress(20 + (i + 1) / totalChapters * 60)
      }

      if (processingMode === 'summary') {
        // 文字总结模式的后续步骤
        // 步骤4: 分析章节关联
        setCurrentStep('正在分析章节关联...')
        let connections = cacheService.getString(cacheKey, 'connections')
        if (!connections) {
          console.log('🔄 [DEBUG] 缓存未命中，开始分析章节关联')
          connections = await aiService.analyzeConnections(processedChapters, processingOptions.outputLanguage)
          cacheService.setCache(cacheKey, 'connections', connections)
          console.log('💾 [DEBUG] 章节关联已缓存')
        } else {
          console.log('✅ [DEBUG] 使用缓存的章节关联')
        }

        setBookSummary(prevSummary => ({
          ...prevSummary!,
          connections
        }))
        setProgress(85)

        // 步骤5: 生成全书总结
        setCurrentStep('正在生成全书总结...')
        let overallSummary = cacheService.getString(cacheKey, 'overall_summary')
        if (!overallSummary) {
          console.log('🔄 [DEBUG] 缓存未命中，开始生成全书总结')
          overallSummary = await aiService.generateOverallSummary(
            bookData.title,
            processedChapters,
            connections!,
            processingOptions.outputLanguage
          )
          cacheService.setCache(cacheKey, 'overall_summary', overallSummary)
          console.log('💾 [DEBUG] 全书总结已缓存')
        } else {
          console.log('✅ [DEBUG] 使用缓存的全书总结')
        }

        setBookSummary(prevSummary => ({
          ...prevSummary!,
          overallSummary
        }))
      } else if (processingMode === 'mindmap') {
        // 章节思维导图模式的后续步骤
        // 步骤4: 合并章节思维导图
        setCurrentStep('正在合并章节思维导图...')
        let combinedMindMap = cacheService.getMindMap(cacheKey, 'merged_mindmap')
        if (!combinedMindMap) {
          console.log('🔄 [DEBUG] 缓存未命中，开始合并章节思维导图')
          // 创建根节点
          const rootNode = {
            topic: bookData.title,
            id: '0',
            tags: ['全书'],
            children: processedChapters.map((chapter, index) => ({
              topic: chapter.title,
              id: `chapter_${index + 1}`,
              children: chapter.mindMap?.nodeData?.children || []
            }))
          }

          combinedMindMap = {
            nodeData: rootNode,
            arrows: [],
            summaries: processedChapters.reduce((acc, chapter) => acc.concat(chapter.mindMap?.summaries || []), [] as Summary[])
          }

          cacheService.setCache(cacheKey, 'merged_mindmap', combinedMindMap)
          console.log('💾 [DEBUG] 合并思维导图已缓存')
        } else {
          console.log('✅ [DEBUG] 使用缓存的合并思维导图')
        }

        setProgress(85)

        setBookMindMap(prevMindMap => ({
          ...prevMindMap!,
          combinedMindMap
        }))
      } else if (processingMode === 'combined-mindmap') {
        // 整书思维导图模式的后续步骤
        // 步骤4: 生成整书思维导图
        setCurrentStep('正在生成整书思维导图...')
        let combinedMindMap = cacheService.getMindMap(cacheKey, 'combined_mindmap')
        if (!combinedMindMap) {
          console.log('🔄 [DEBUG] 缓存未命中，开始生成整书思维导图')
          combinedMindMap = await aiService.generateCombinedMindMap(bookData.title, processedChapters, customPrompt)
          cacheService.setCache(cacheKey, 'combined_mindmap', combinedMindMap)
          console.log('💾 [DEBUG] 整书思维导图已缓存')
        } else {
          console.log('✅ [DEBUG] 使用缓存的整书思维导图')
        }

        setBookMindMap(prevMindMap => ({
          ...prevMindMap!,
          combinedMindMap
        }))
        setProgress(85)
      }

      setProgress(100)
      setCurrentStep('处理完成！')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('progress.processingError'), {
        duration: 5000,
        position: 'top-center',
      })
    } finally {
      setProcessing(false)
    }
  }, [extractedChapters, bookData, apiKey, file, webUrl, textContent, inputMode, selectedChapters, processingMode, bookType, customPrompt, processingOptions.outputLanguage, t])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2 relative">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            {t('app.title')}
          </h1>
          <p className="text-gray-600">{t('app.description')}</p>
          <LanguageSwitcher />
        </div>

        {/* 文件上传和配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('upload.title')}
            </CardTitle>
            <CardDescription>
              {t('upload.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 输入模式选择 */}
            <div className="space-y-2">
              <Label>{t('upload.inputMode')}</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={inputMode === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputModeChange('file')}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t('upload.fileMode')}
                </Button>
                <Button
                  variant={inputMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputModeChange('url')}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  {t('upload.urlMode')}
                </Button>
                <Button
                  variant={inputMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputModeChange('text')}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t('upload.textMode')}
                </Button>
              </div>
            </div>

            {/* 文件输入 */}
            {inputMode === 'file' && (
              <div className="space-y-2">
                <Label htmlFor="file">{t('upload.selectFile')}</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".epub,.pdf,.docx,.doc,.html,.htm"
                  onChange={handleFileChange}
                  disabled={processing}
                />
              </div>
            )}

            {/* URL输入 */}
            {inputMode === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="url">{t('upload.enterUrl')}</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder={t('upload.urlPlaceholder')}
                  value={webUrl}
                  onChange={handleUrlChange}
                  disabled={processing}
                />
                <p className="text-xs text-gray-500">
                  {t('upload.urlDescription')}
                </p>
              </div>
            )}

            {/* 文本输入 */}
            {inputMode === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="text">{t('upload.enterText')}</Label>
                <Textarea
                  id="text"
                  placeholder={t('upload.textPlaceholder')}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={processing}
                  className="min-h-32 resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t('upload.textDescription')}</span>
                  <span>{textContent.length}/2000</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {inputMode === 'file' ? (
                  <>
                    <FileText className="h-4 w-4" />
                    {t('upload.selectedFile')}: {file?.name || t('upload.noFileSelected')}
                  </>
                ) : inputMode === 'url' ? (
                  <>
                    <Globe className="h-4 w-4" />
                    {t('upload.selectedUrl')}: {webUrl || t('upload.noUrlEntered')}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    {t('upload.selectedText')}: {textContent ? `${textContent.length} 字符` : t('upload.noTextEntered')}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DynamicConfigDialog processing={processing} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBookCache}
                  disabled={processing}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('upload.clearCache')}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {inputMode === 'file' ? (
                <Button
                  onClick={extractFileChapters}
                  disabled={!file || extractingChapters || processing}
                  className="w-full"
                >
                  {extractingChapters ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('upload.extractingChapters')}
                    </>
                  ) : (
                    <>
                      <List className="mr-2 h-4 w-4" />
                      {t('upload.extractChapters')}
                    </>
                  )}
                </Button>
              ) : inputMode === 'url' ? (
                <Button
                  onClick={handleWebUrlExtract}
                  disabled={!webUrl.trim() || webProcessing || processing}
                  className="w-full"
                >
                  {webProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('upload.extractingWebContent')}
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      {t('upload.extractWebContent')}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleTextExtract}
                  disabled={!textContent.trim() || textProcessing || processing}
                  className="w-full"
                >
                  {textProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('upload.extractingTextContent')}
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      {t('upload.extractTextContent')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>



        {/* 章节信息 */}
        {extractedChapters && bookData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                {t('chapters.title')}
              </CardTitle>
              <CardDescription>
                {bookData.title} - {bookData.author} | {t('chapters.totalChapters', { count: extractedChapters.length })}，{t('chapters.selectedChapters', { count: selectedChapters.size })}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="select-all"
                  checked={selectedChapters.size === extractedChapters.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  {t('chapters.selectAll')}
                </Label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {extractedChapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Checkbox
                      id={`chapter-${chapter.id}`}
                      checked={selectedChapters.has(chapter.id)}
                      onCheckedChange={(checked) => handleChapterSelect(chapter.id, checked as boolean)}
                    />
                    <Label
                      htmlFor={`chapter-${chapter.id}`}
                      className="text-sm truncate cursor-pointer flex-1"
                      title={chapter.title}
                    >
                      {chapter.title}
                    </Label>
                  </div>
                ))}
              </div>

              {/* 自定义提示词输入框 */}
              <div className="space-y-2">
                <Label htmlFor="custom-prompt" className="text-sm font-medium">
                  {t('chapters.customPrompt')}
                </Label>
                <Textarea
                  id="custom-prompt"
                  placeholder={t('chapters.customPromptPlaceholder')}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-20 resize-none"
                  disabled={processing || extractingChapters}
                />
                <p className="text-xs text-gray-500">
                  {t('chapters.customPromptDescription')}
                </p>
              </div>

              <Button
                onClick={() => {
                  if (!apiKey) {
                    toast.error(t('chapters.apiKeyRequired'), {
                      duration: 3000,
                      position: 'top-center',
                    })
                    return
                  }
                  processEbook()
                }}
                disabled={!extractedChapters || processing || extractingChapters || selectedChapters.size === 0}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('chapters.processing')}
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    {t('chapters.startProcessing')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
        {(processing || extractingChapters || webProcessing || textProcessing) && (
          <Card>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}


        {/* 结果展示 */}
        {(bookSummary || bookMindMap) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {processingMode === 'summary' ? (
                  <><BookOpen className="h-5 w-5" />{t('results.summaryTitle', { title: bookSummary?.title })}</>
                ) : processingMode === 'mindmap' ? (
                  <><Network className="h-5 w-5" />{t('results.chapterMindMapTitle', { title: bookMindMap?.title })}</>
                ) : (
                  <><Network className="h-5 w-5" />{t('results.wholeMindMapTitle', { title: bookMindMap?.title })}</>
                )}
              </CardTitle>
              <CardDescription>
                {t('results.author', { author: bookSummary?.author || bookMindMap?.author })} | {t('results.chapterCount', { count: bookSummary?.chapters.length || bookMindMap?.chapters.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingMode === 'summary' && bookSummary ? (
                <Tabs defaultValue="chapters" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chapters">{t('results.tabs.chapterSummary')}</TabsTrigger>
                    <TabsTrigger value="connections">{t('results.tabs.connections')}</TabsTrigger>
                    <TabsTrigger value="overall">{t('results.tabs.overallSummary')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chapters" className="grid grid-cols-1 gap-4">
                    {bookSummary.chapters.map((chapter, index) => (
                      <MarkdownCard
                        key={chapter.id}
                        id={chapter.id}
                        title={chapter.title}
                        content={chapter.content}
                        markdownContent={chapter.summary || ''}
                        index={index}
                        onClearCache={clearChapterCache}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="connections">
                    <MarkdownCard
                      id="connections"
                      title={t('results.tabs.connections')}
                      content={bookSummary.connections}
                      markdownContent={bookSummary.connections}
                      index={0}
                      showClearCache={true}
                      showViewContent={false}
                      showCopyButton={true}
                      onClearCache={() => clearSpecificCache('connections')}
                    />
                  </TabsContent>

                  <TabsContent value="overall">
                    <MarkdownCard
                      id="overall"
                      title={t('results.tabs.overallSummary')}
                      content={bookSummary.overallSummary}
                      markdownContent={bookSummary.overallSummary}
                      index={0}
                      showClearCache={true}
                      showViewContent={false}
                      showCopyButton={true}
                      onClearCache={() => clearSpecificCache('overall_summary')}
                    />
                  </TabsContent>
                </Tabs>
              ) : processingMode === 'mindmap' && bookMindMap ? (
                <Tabs defaultValue="chapters" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chapters">{t('results.tabs.chapterMindMaps')}</TabsTrigger>
                    <TabsTrigger value="combined">{t('results.tabs.combinedMindMap')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chapters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookMindMap.chapters.map((chapter, index) => (
                      chapter.mindMap && (
                        <MindMapCard
                          key={chapter.id}
                          id={chapter.id}
                          title={chapter.title}
                          content={chapter.content}
                          mindMapData={chapter.mindMap}
                          index={index}
                          showCopyButton={false}
                          onClearCache={clearChapterCache}
                          onOpenInMindElixir={openInMindElixir}
                          onDownloadMindMap={downloadMindMap}
                          mindElixirOptions={options}
                        />
                      )
                    ))}
                  </TabsContent>

                  <TabsContent value="combined">
                    {bookMindMap.combinedMindMap ? (
                      <MindMapCard
                        id="combined"
                        title={t('results.tabs.combinedMindMap')}
                        content=""
                        mindMapData={bookMindMap.combinedMindMap}
                        index={0}
                        onOpenInMindElixir={(mindmapData) => openInMindElixir(mindmapData, t('results.combinedMindMapTitle', { title: bookMindMap.title }))}
                        onDownloadMindMap={downloadMindMap}
                        onClearCache={() => clearSpecificCache('merged_mindmap')}
                        showClearCache={true}
                        showViewContent={false}
                        showCopyButton={false}
                        mindMapClassName="w-full h-[600px] mx-auto"
                        mindElixirOptions={options}
                      />
                    ) : (
                      <Card>
                        <CardContent>
                          <div className="text-center text-gray-500 py-8">
                            {t('results.generatingMindMap')}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              ) : processingMode === 'combined-mindmap' && bookMindMap ? (
                bookMindMap.combinedMindMap ? (
                  <MindMapCard
                    id="whole-book"
                    title={t('results.tabs.combinedMindMap')}
                    content=""
                    mindMapData={bookMindMap.combinedMindMap}
                    index={0}
                    onOpenInMindElixir={(mindmapData) => openInMindElixir(mindmapData, t('results.combinedMindMapTitle', { title: bookMindMap.title }))}
                    onDownloadMindMap={downloadMindMap}
                    onClearCache={() => clearSpecificCache('combined_mindmap')}
                    showClearCache={true}
                    showViewContent={false}
                    showCopyButton={false}
                    mindMapClassName="w-full h-[600px] mx-auto"
                    mindElixirOptions={options}
                  />
                ) : (
                  <Card>
                    <CardContent>
                      <div className="text-center text-gray-500 py-8">
                        {t('results.generatingMindMap')}
                      </div>
                    </CardContent>
                  </Card>
                )
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 回到顶部按钮 */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700"
          size="icon"
          aria-label={t('common.backToTop')}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

export default App
