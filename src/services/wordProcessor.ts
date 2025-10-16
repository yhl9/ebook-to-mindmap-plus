import mammoth from 'mammoth'
import { SKIP_CHAPTER_KEYWORDS } from './constants'
import { WordDebugHelper } from './wordDebugHelper'
import { ChapterTestHelper } from '../utils/chapterTestHelper'
import { HTMLAnalyzer } from '../utils/htmlAnalyzer'

// 备用Word处理器，用于处理mammoth无法处理的文档
class FallbackWordProcessor {
  async extractTextFromWord(file: File): Promise<string> {
    // 这是一个简化的备用方案，直接返回文件名作为内容
    // 在实际应用中，可以考虑使用其他库如docx-parser
    console.log(`⚠️ [DEBUG] 使用备用Word处理器处理文件: ${file.name}`)
    return `文档内容: ${file.name}\n\n这是一个备用处理方案，建议将Word文档转换为PDF或EPUB格式以获得更好的处理效果。`
  }
}

export interface ChapterData {
  id: string
  title: string
  content: string
}

export interface BookData {
  title: string
  author: string
  totalPages: number
}

export class WordProcessor {
  private fallbackProcessor = new FallbackWordProcessor()

  async parseWord(file: File): Promise<BookData> {
    try {
      console.log(`📚 [DEBUG] 开始解析Word文件: ${file.name}, 大小: ${file.size} bytes`)
      
      // 检查文件大小
      if (file.size > 50 * 1024 * 1024) { // 50MB
        throw new Error('文件过大，请选择小于50MB的Word文档')
      }

      // 将File转换为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      console.log(`📚 [DEBUG] 文件转换为ArrayBuffer完成，大小: ${arrayBuffer.byteLength} bytes`)

      // 使用mammoth解析Word文档，简化配置以避免兼容性问题
      const result = await mammoth.convertToHtml({ 
        arrayBuffer
      })
      
      // 检查是否有警告信息
      if (result.messages && result.messages.length > 0) {
        console.warn(`⚠️ [DEBUG] mammoth转换警告:`, result.messages)
      }
      
      // 从文件名提取标题
      const title = file.name.replace(/\.(docx?|doc)$/i, '') || '未知标题'
      const author = '未知作者' // Word文档通常不包含作者信息

      console.log(`📚 [DEBUG] Word解析完成:`, {
        title,
        author,
        contentLength: result.value.length,
        warnings: result.messages?.length || 0
      })

      return {
        title,
        author,
        totalPages: 1 // Word文档没有固定页数概念
      }
    } catch (error) {
      console.error(`❌ [DEBUG] Word解析失败，尝试备用方案:`, error)
      
      // 如果mammoth失败，使用备用方案
      try {
        const title = file.name.replace(/\.(docx?|doc)$/i, '') || '未知标题'
        console.log(`🔄 [DEBUG] 使用备用Word处理器`)
        
        return {
          title,
          author: '未知作者',
          totalPages: 1
        }
      } catch (fallbackError) {
        console.error(`❌ [DEBUG] 备用方案也失败:`, fallbackError)
        
        // 提供更详细的错误信息
        if (error instanceof Error) {
          if (error.message.includes('permission problems')) {
            throw new Error('Word文档权限问题，请确保文档未被其他程序占用，或尝试另存为新文件')
          } else if (error.message.includes('could not be read')) {
            throw new Error('无法读取Word文档，可能是文件损坏或格式不支持，请尝试另存为DOCX格式')
          } else if (error.message.includes('Invalid file')) {
            throw new Error('无效的Word文档格式，请确保文件是有效的DOC或DOCX格式')
          }
        }
        
        throw new Error(`解析Word文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  async extractChapters(file: File, useSmartDetection: boolean = false, skipNonEssentialChapters: boolean = true, _maxSubChapterDepth: number = 0): Promise<ChapterData[]> {
    try {
      console.log(`📚 [DEBUG] 开始提取Word章节，智能检测: ${useSmartDetection}`)
      
      const arrayBuffer = await file.arrayBuffer()
      
      // 使用mammoth解析Word文档，添加错误处理
      const result = await mammoth.convertToHtml({ 
        arrayBuffer
      })
      
      const htmlContent = result.value

      console.log(`📚 [DEBUG] Word内容提取完成，HTML长度: ${htmlContent.length}`)

      // 检查内容是否为空
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('Word文档内容为空，请检查文档是否包含有效内容')
      }

      const chapters: ChapterData[] = []

      // 使用结构化内容提取，包括标题信息
      const { textContent, headings } = this.extractStructuredContent(htmlContent)
      
      if (textContent.trim().length < 100) {
        throw new Error('提取的文本内容过少，请检查Word文档格式')
      }
      
      if (useSmartDetection) {
        // 优先使用基于文本内容的章节检测（借鉴PDF成功经验）
        if (headings.length > 0) {
          console.log(`📋 [DEBUG] 使用基于文本内容的章节检测，找到 ${headings.length} 个标题`)
          console.log(`📋 [DEBUG] 标题列表:`, headings.map(h => h.text))
          const structuredChapters = this.extractChaptersFromTextContent(textContent, headings)
          console.log(`📊 [DEBUG] 章节提取结果: ${structuredChapters.length} 个章节`)
          chapters.push(...structuredChapters)
        } else {
          // 回退到智能检测
          console.log(`📋 [DEBUG] 未找到文本标题，使用智能检测`)
          const detectedChapters = this.detectChapters(textContent)
          chapters.push(...detectedChapters)
        }
      } else {
        // 简单按段落分组
        const paragraphs = this.splitIntoParagraphs(textContent)
        
        if (paragraphs.length === 0) {
          throw new Error('无法从Word文档中提取段落内容')
        }
        
        // 将段落按一定数量分组为章节
        const paragraphsPerChapter = Math.max(3, Math.floor(paragraphs.length / 10))
        
        for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
          const endIndex = Math.min(i + paragraphsPerChapter, paragraphs.length)
          const chapterContent = paragraphs.slice(i, endIndex).join('\n\n').trim()
          
          if (chapterContent.length > 200) {
            chapters.push({
              id: `chapter-${Math.floor(i / paragraphsPerChapter) + 1}`,
              title: `第 ${Math.floor(i / paragraphsPerChapter) + 1} 部分`,
              content: chapterContent
            })
          }
        }
      }

      // 过滤掉需要跳过的章节
      const filteredChapters = chapters.filter(chapter => {
        if (skipNonEssentialChapters && this.shouldSkipChapter(chapter.title)) {
          console.log(`⏭️ [DEBUG] 跳过无关键内容章节: "${chapter.title}"`)
          return false
        }
        return true
      })

      console.log(`📊 [DEBUG] 最终提取到 ${filteredChapters.length} 个章节`)

      if (filteredChapters.length === 0) {
        throw new Error('未找到有效的章节内容，请检查Word文档是否包含可识别的章节结构')
      }

      return filteredChapters
    } catch (error) {
      console.error(`❌ [DEBUG] 提取章节失败，尝试备用方案:`, error)
      
      // 如果mammoth失败，使用备用方案
      try {
        console.log(`🔄 [DEBUG] 使用备用Word处理器提取章节`)
        const fallbackContent = await this.fallbackProcessor.extractTextFromWord(file)
        
        // 创建单个章节
        const chapters: ChapterData[] = [{
          id: 'chapter-1',
          title: '文档内容',
          content: fallbackContent
        }]

        console.log(`📊 [DEBUG] 备用方案提取到 ${chapters.length} 个章节`)
        return chapters
      } catch (fallbackError) {
        console.error(`❌ [DEBUG] 备用方案也失败:`, fallbackError)
        
        // 提供更详细的错误信息
        if (error instanceof Error) {
          if (error.message.includes('permission problems')) {
            throw new Error('Word文档权限问题，请确保文档未被其他程序占用，或尝试另存为新文件')
          } else if (error.message.includes('could not be read')) {
            throw new Error('无法读取Word文档，可能是文件损坏或格式不支持，请尝试另存为DOCX格式')
          } else if (error.message.includes('Invalid file')) {
            throw new Error('无效的Word文档格式，请确保文件是有效的DOC或DOCX格式')
          }
        }
        
        throw new Error(`提取章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  private extractTextFromHTML(htmlContent: string): string {
    try {
      console.log(`🔍 [DEBUG] 开始解析HTML内容，长度: ${htmlContent.length}`)

      // 创建一个临时的DOM解析器
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')

      // 检查解析错误
      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        console.warn(`⚠️ [DEBUG] DOM解析出现错误，将使用正则表达式备选方案:`, parseError.textContent)
        throw new Error('DOM解析失败')
      }

      // 移除脚本和样式标签
      const scripts = doc.querySelectorAll('script, style')
      scripts.forEach(el => el.remove())

      // 获取纯文本内容
      let textContent = doc.body?.textContent || ''

      // 清理文本：移除多余的空白字符
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      console.log(`✨ [DEBUG] 清理后文本长度: ${textContent.length}`)

      return textContent
    } catch (error) {
      console.warn(`⚠️ [DEBUG] DOM解析失败，使用正则表达式备选方案:`, error)
      // 如果DOM解析失败，使用正则表达式作为备选方案
      return this.extractTextWithRegex(htmlContent)
    }
  }

  // 新增：从HTML中提取结构化内容，包括标题
  private extractStructuredContent(htmlContent: string): { textContent: string; headings: Array<{ level: number; text: string; index: number }> } {
    try {
      console.log(`🔍 [DEBUG] 开始提取结构化内容，HTML长度: ${htmlContent.length}`)

      const parser = new DOMParser()
      // 尝试不同的解析类型，text/html可能不是最佳选择
      let doc = parser.parseFromString(htmlContent, 'text/html')
      // let doc = parser.parseFromString(htmlContent, 'text/xml')
      // 如果HTML解析失败，尝试XML解析
      if (!doc || doc.documentElement.nodeName === 'parsererror') {
        console.log(`⚠️ [DEBUG] HTML解析失败，尝试XML解析`)
        doc = parser.parseFromString(htmlContent, 'application/xml')
      }
      
      // 如果XML解析也失败，尝试text/xml
      if (!doc || doc.documentElement.nodeName === 'parsererror') {
        console.log(`⚠️ [DEBUG] XML解析失败，尝试text/xml`)
        doc = parser.parseFromString(htmlContent, 'text/xml')
      }
      
      // 如果所有解析都失败，使用原始HTML
      if (!doc || doc.documentElement.nodeName === 'parsererror') {
        console.log(`⚠️ [DEBUG] 所有解析失败，使用原始HTML`)
        doc = parser.parseFromString(htmlContent, 'text/html')
      }

      // 移除脚本和样式标签
      const scripts = doc.querySelectorAll('script, style')
      scripts.forEach(el => el.remove())

      // 调试：输出HTML结构信息
      console.log(`🔍 [DEBUG] HTML结构预览:`, htmlContent.substring(0, 1000))
      console.log(`🔍 [DEBUG] HTML完整长度:`, htmlContent.length)
      
      // 使用调试助手分析HTML结构
      WordDebugHelper.analyzeHTMLStructure(htmlContent)
      
      // 使用HTML分析工具进行深度分析
      HTMLAnalyzer.analyzeHTMLContent(htmlContent)
      
      // 添加HTML内容调试信息
      console.log(`🔍 [DEBUG] HTML内容调试信息:`)
      console.log(`📄 [DEBUG] HTML前500字符:`, htmlContent.substring(0, 500))
      console.log(`📄 [DEBUG] HTML后500字符:`, htmlContent.substring(htmlContent.length - 500))
      
      // 检查是否包含Chapter关键词
      const chapterCount = (htmlContent.match(/Chapter/gi) || []).length
      console.log(`📋 [DEBUG] HTML中Chapter出现次数: ${chapterCount}`)
      
      if (chapterCount > 0) {
        // 找到所有Chapter出现的位置
        const chapterMatches = htmlContent.match(/Chapter[^<]*/gi)
        if (chapterMatches) {
          console.log(`📋 [DEBUG] 找到的Chapter匹配:`)
          chapterMatches.slice(0, 10).forEach((match, index) => {
            console.log(`   ${index + 1}. "${match.trim()}"`)
          })
        }
      }
      
      // 使用Chapter测试助手分析文本
      const bodyTextContent = doc.body?.textContent || ''
      ChapterTestHelper.analyzeTextForChapters(bodyTextContent)
      
      // 如果是测试模式，运行额外的测试
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 [Word测试] 运行开发模式测试...')
        // 这里可以添加额外的测试逻辑
      }
      
      // 获取纯文本内容
      let finalTextContent = doc.body?.textContent || ''
      finalTextContent = finalTextContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      // 优先使用HTML标题标签（最准确的方法）
      console.log(`🔍 [DEBUG] 优先使用HTML标题标签进行章节检测...`)
      const htmlHeadings = this.extractHeadingsFromHTML(doc)
      console.log(`📋 [DEBUG] 从HTML标题标签提取到 ${htmlHeadings.length} 个标题`)
      
      let headings = htmlHeadings
      
      // 如果HTML标题标签检测失败，尝试其他方法
      if (headings.length === 0) {
        console.log(`⚠️ [DEBUG] HTML标题标签检测失败，尝试基于文本内容的章节检测...`)
        const textHeadings = this.detectChaptersFromText(finalTextContent)
        headings.push(...textHeadings)
      }
      
      // 如果基于文本的检测失败，尝试直接分析HTML内容
      if (headings.length === 0) {
        console.log(`⚠️ [DEBUG] 基于文本的检测失败，尝试直接分析HTML内容...`)
        const directHeadings = this.detectChaptersFromHTML(htmlContent)
        headings.push(...directHeadings)
      }
      
      // 如果所有方法都失败，使用最简单的正则表达式方法
      if (headings.length === 0) {
        console.log(`⚠️ [DEBUG] 所有检测方法失败，使用最简单的正则表达式方法...`)
        const simpleHeadings = this.detectChaptersWithSimpleRegex(htmlContent)
        headings.push(...simpleHeadings)
      }
      
      // 如果仍然没有找到，尝试直接分析HTML文本内容
      if (headings.length === 0) {
        console.log(`⚠️ [DEBUG] 所有方法都失败，尝试直接分析HTML文本内容...`)
        const directTextHeadings = this.detectChaptersFromHTMLText(htmlContent)
        headings.push(...directTextHeadings)
      }

      console.log(`✨ [DEBUG] 结构化内容提取完成，文本长度: ${finalTextContent.length}, 标题数量: ${headings.length}`)

      return { textContent: finalTextContent, headings }
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 结构化内容提取失败，使用普通文本提取:`, error)
      return { 
        textContent: this.extractTextFromHTML(htmlContent), 
        headings: [] 
      }
    }
  }

  private extractTextWithRegex(htmlContent: string): string {
    console.log(`🔧 [DEBUG] 使用正则表达式方案解析内容，长度: ${htmlContent.length}`)

    // 移除HTML标签
    let textContent = htmlContent.replace(/<[^>]+>/g, ' ')
    console.log(`🏷️ [DEBUG] 移除HTML标签后长度: ${textContent.length}`)

    // 解码HTML实体
    textContent = textContent
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
    console.log(`🔤 [DEBUG] 解码HTML实体后长度: ${textContent.length}`)

    // 清理空白字符
    textContent = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()

    console.log(`✨ [DEBUG] 正则方案最终文本长度: ${textContent.length}`)

    return textContent
  }

  private splitIntoParagraphs(textContent: string): string[] {
    // 按段落分割文本
    return textContent
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
  }

  // 新增：基于HTML标题结构提取章节
  private extractChaptersFromHeadings(textContent: string, headings: Array<{ level: number; text: string; index: number }>): ChapterData[] {
    console.log(`📋 [DEBUG] 基于HTML标题结构提取章节，标题数量: ${headings.length}`)

    const chapters: ChapterData[] = []
    const paragraphs = this.splitIntoParagraphs(textContent)

    // 按标题级别分组，主要关注一级和二级标题
    const mainHeadings = headings.filter(h => h.level <= 2)
    
    if (mainHeadings.length === 0) {
      console.log(`⚠️ [DEBUG] 未找到主要标题，回退到段落分组`)
      return this.extractChaptersFromParagraphs(paragraphs)
    }

    for (let i = 0; i < mainHeadings.length; i++) {
      const heading = mainHeadings[i]
      const nextHeading = mainHeadings[i + 1]
      
      // 查找标题在段落中的位置
      const headingIndex = paragraphs.findIndex(p => 
        p.includes(heading.text) || heading.text.includes(p.trim())
      )
      
      if (headingIndex === -1) {
        console.log(`⚠️ [DEBUG] 未找到标题 "${heading.text}" 在段落中的位置`)
        continue
      }

      // 确定章节内容的结束位置
      let endIndex = paragraphs.length
      if (nextHeading) {
        const nextHeadingIndex = paragraphs.findIndex(p => 
          p.includes(nextHeading.text) || nextHeading.text.includes(p.trim())
        )
        if (nextHeadingIndex !== -1) {
          endIndex = nextHeadingIndex
        }
      }

      // 提取章节内容
      const chapterParagraphs = paragraphs.slice(headingIndex, endIndex)
      const chapterContent = chapterParagraphs.join('\n\n').trim()

      if (chapterContent.length > 200) {
        chapters.push({
          id: `chapter-${chapters.length + 1}`,
          title: heading.text,
          content: chapterContent
        })
        console.log(`📖 [DEBUG] 提取章节: "${heading.text}" (${chapterContent.length} 字符)`)
      }
    }

    console.log(`🔍 [DEBUG] HTML结构章节提取完成，找到 ${chapters.length} 个章节`)
    return chapters
  }

  // 新增：从段落中提取章节（备用方案）
  private extractChaptersFromParagraphs(paragraphs: string[]): ChapterData[] {
    console.log(`📋 [DEBUG] 从段落中提取章节，段落数量: ${paragraphs.length}`)

    const chapters: ChapterData[] = []
    const paragraphsPerChapter = Math.max(3, Math.floor(paragraphs.length / 10))
    
    for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
      const endIndex = Math.min(i + paragraphsPerChapter, paragraphs.length)
      const chapterContent = paragraphs.slice(i, endIndex).join('\n\n').trim()
      
      if (chapterContent.length > 200) {
        chapters.push({
          id: `chapter-${chapters.length + 1}`,
          title: `第 ${chapters.length + 1} 部分`,
          content: chapterContent
        })
      }
    }

    return chapters
  }

  private detectChapters(textContent: string): ChapterData[] {
    console.log(`🧠 [DEBUG] 启用Word智能章节检测，文本长度: ${textContent.length}`)

    const chapterPatterns = [
      /^第[一二三四五六七八九十\d]+章[\s\S]*$/m,
      /^Chapter\s+\d+[\s\S]*$/mi,
      /^第[一二三四五六七八九十\d]+节[\s\S]*$/m,
      /^\d+\.[\s\S]*$/m,
      /^[一二三四五六七八九十]、[\s\S]*$/m,
      // 新增更多章节模式
      /^第\s*[一二三四五六七八九十\d]+\s*章[\s\S]*$/m,
      /^Chapter\s*\d+[\s\S]*$/mi,
      /^第\s*[一二三四五六七八九十\d]+\s*节[\s\S]*$/m,
      /^\d+\.\s*[\s\S]*$/m,
      /^[一二三四五六七八九十]、\s*[\s\S]*$/m
    ]

    const chapters: ChapterData[] = []
    let currentChapter: { title: string; content: string } | null = null
    let chapterCount = 0

    // 按段落分割文本
    const paragraphs = this.splitIntoParagraphs(textContent)

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim()
      if (paragraph.length < 50) continue // 降低最小长度要求

      // 检查是否是新章节的开始
      let isNewChapter = false
      let chapterTitle = ''

      for (const pattern of chapterPatterns) {
        const match = paragraph.match(pattern)
        if (match) {
          // 提取章节标题（取前150个字符作为标题）
          const titleMatch = paragraph.match(/^(.{1,150})/)
          chapterTitle = titleMatch ? titleMatch[1].trim() : `章节 ${chapterCount + 1}`
          isNewChapter = true
          break
        }
      }

      if (isNewChapter || !currentChapter) {
        // 保存上一个章节
        if (currentChapter && currentChapter.content.trim().length > 100) {
          chapters.push({
            id: `chapter-${chapterCount}`,
            title: currentChapter.title,
            content: currentChapter.content.trim()
          })
        }

        // 开始新章节
        chapterCount++
        currentChapter = {
          title: chapterTitle || `第 ${chapterCount} 章`,
          content: paragraph
        }

        console.log(`📖 [DEBUG] 检测到新章节: "${chapterTitle}"`)
      } else {
        // 合并到当前章节
        currentChapter.content += '\n\n' + paragraph
      }
    }

    // 保存最后一个章节
    if (currentChapter && currentChapter.content.trim().length > 100) {
      chapters.push({
        id: `chapter-${chapterCount}`,
        title: currentChapter.title,
        content: currentChapter.content.trim()
      })
    }

    console.log(`🔍 [DEBUG] Word章节检测完成，找到 ${chapters.length} 个章节`)

    return chapters
  }

  // 新增：判断文本是否可能是标题
  private isLikelyHeading(text: string, style: string): boolean {
    // 检查文本长度（标题通常较短）
    if (text.length > 150) return false
    
    // 检查是否包含标题关键词（扩展英文关键词）
    const headingKeywords = [
      // 中文关键词
      '第', '章', '节', '一、', '二、', '三、', '四、', '五、',
      '1.', '2.', '3.', '4.', '5.', '概述', '介绍', '总结', '结论',
      // 英文关键词
      'Chapter', 'chapter', 'Introduction', 'introduction',
      'Conclusion', 'conclusion', 'Summary', 'summary',
      'Overview', 'overview', 'Getting Started', 'getting started',
      'What is', 'what is', 'How to', 'how to',
      'Step', 'step', 'Part', 'part', 'Section', 'section',
      'Table of Contents', 'Contents', 'contents',
      'About', 'about', 'Welcome', 'welcome',
      // 新增：更具体的Chapter模式
      'Chapter one', 'Chapter two', 'Chapter three', 'Chapter four', 'Chapter five',
      'Chapter six', 'Chapter seven', 'Chapter eight', 'Chapter nine', 'Chapter ten',
      'chapter 1', 'chapter 2', 'chapter 3', 'chapter 4', 'chapter 5',
      'chapter 6', 'chapter 7', 'chapter 8', 'chapter 9', 'chapter 10'
    ]
    
    const hasHeadingKeyword = headingKeywords.some(keyword => 
      text.includes(keyword)
    )
    
    // 检查样式特征
    const hasHeadingStyle = style.includes('font-weight:bold') || 
                           style.includes('font-weight: bold') ||
                           style.includes('font-size:') ||
                           style.includes('text-align:center') ||
                           style.includes('text-align: center')
    
    // 检查是否以数字或中文数字开头
    const startsWithNumber = /^[一二三四五六七八九十\d]/.test(text.trim())
    
    // 检查是否以英文大写字母开头（可能是标题）
    const startsWithCapital = /^[A-Z]/.test(text.trim())
    
    // 检查是否包含常见的标题模式
    const hasTitlePattern = /^(Chapter|Part|Section|Step)\s*\d+/i.test(text.trim()) ||
                           /^\d+\.\s*[A-Z]/.test(text.trim()) ||
                           /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text.trim()) ||
                           /^Chapter\s*\d+[:\s]/i.test(text.trim()) ||
                           /^\d+[\.\:]\s*[A-Z]/.test(text.trim())
    
    return hasHeadingKeyword || hasHeadingStyle || startsWithNumber || 
           (startsWithCapital && text.length < 50) || hasTitlePattern
  }
  
  // 新增：确定标题级别
  private determineHeadingLevel(text: string, style: string): number {
    // 根据文本内容判断级别（扩展英文模式）
    if (text.includes('第') && text.includes('章')) return 1
    if (text.includes('Chapter')) return 1
    if (text.includes('Introduction') || text.includes('introduction')) return 1
    if (text.includes('Overview') || text.includes('overview')) return 1
    if (text.includes('Getting Started') || text.includes('getting started')) return 1
    if (text.includes('第') && text.includes('节')) return 2
    if (text.includes('Part') || text.includes('part')) return 1
    if (text.includes('Section') || text.includes('section')) return 2
    if (text.includes('Step') || text.includes('step')) return 3
    if (text.includes('概述') || text.includes('介绍')) return 1
    if (text.includes('总结') || text.includes('结论')) return 1
    if (text.includes('Conclusion') || text.includes('conclusion')) return 1
    if (text.includes('Summary') || text.includes('summary')) return 1
    
    // 根据样式判断级别
    if (style.includes('font-size:24pt') || style.includes('font-size:22pt')) return 1
    if (style.includes('font-size:18pt') || style.includes('font-size:20pt')) return 1
    if (style.includes('font-size:16pt')) return 2
    if (style.includes('font-size:14pt')) return 3
    if (style.includes('font-size:12pt')) return 4
    
    // 根据文本长度判断（较短的通常是更高级别的标题）
    if (text.length < 20) return 1
    if (text.length < 50) return 2
    if (text.length < 80) return 3
    
    // 根据文本模式判断
    if (/^(Chapter|Part|Introduction|Overview)/i.test(text)) return 1
    if (/^(Section|Step)/i.test(text)) return 2
    if (/^\d+\.\s*[A-Z]/.test(text)) return 3
    
    return 2 // 默认二级标题
  }

  // 新增：直接分析HTML内容检测章节
  private detectChaptersFromHTML(htmlContent: string): Array<{ level: number; text: string; index: number }> {
    console.log(`🔍 [DEBUG] 开始直接分析HTML内容检测章节，HTML长度: ${htmlContent.length}`)
    
    const headings: Array<{ level: number; text: string; index: number }> = []
    
    // 使用正则表达式直接匹配HTML中的Chapter模式
    const chapterPatterns = [
      /<p[^>]*>.*?Chapter\s*\d+[:\s].*?<\/p>/gi,
      /<h[1-6][^>]*>.*?Chapter\s*\d+[:\s].*?<\/h[1-6]>/gi,
      /<p[^>]*>.*?第[一二三四五六七八九十\d]+章.*?<\/p>/gi,
      /<h[1-6][^>]*>.*?第[一二三四五六七八九十\d]+章.*?<\/h[1-6]>/gi,
      // 新增：更宽松的Chapter模式
      /Chapter\s*\d+[:\s][^<]*/gi,
      /第[一二三四五六七八九十\d]+章[^<]*/gi
    ]
    
    chapterPatterns.forEach((pattern, patternIndex) => {
      const matches = htmlContent.match(pattern)
      if (matches) {
        console.log(`📋 [DEBUG] 模式 ${patternIndex + 1} 找到 ${matches.length} 个匹配`)
        matches.forEach((match, _index) => {
          // 提取文本内容
          const textMatch = match.match(/>([^<]+)</)
          if (textMatch) {
            const text = textMatch[1].trim()
            if (text.length > 0 && text.length < 200) {
              const level = match.includes('<h1') ? 1 : 
                          match.includes('<h2') ? 2 : 
                          match.includes('<h3') ? 3 : 1
              
              headings.push({ level, text, index: headings.length })
              console.log(`📋 [DEBUG] HTML直接检测: Level ${level} - "${text}"`)
            }
          } else {
            // 如果没有HTML标签，直接使用匹配的文本
            const text = match.replace(/<[^>]*>/g, '').trim()
            if (text.length > 0 && text.length < 200) {
              const level = 1
              headings.push({ level, text, index: headings.length })
              console.log(`📋 [DEBUG] HTML直接检测: Level ${level} - "${text}"`)
            }
          }
        })
      } else {
        console.log(`📋 [DEBUG] 模式 ${patternIndex + 1} 未找到匹配`)
      }
    })
    
    console.log(`📊 [DEBUG] HTML直接分析检测到 ${headings.length} 个章节`)
    return headings
  }

  // 新增：从HTML标题标签提取标题
  private extractHeadingsFromHTML(doc: Document): Array<{ level: number; text: string; index: number }> {
    console.log(`🔍 [DEBUG] 开始从HTML标题标签提取标题`)
    
    const headings: Array<{ level: number; text: string; index: number }> = []
    
    // 提取所有HTML标题标签
    const headingElements = doc.querySelectorAll('h1, h2, h3')
    console.log(`📋 [DEBUG] 找到 ${headingElements.length} 个HTML标题标签`)
    
    headingElements.forEach((element, index) => {
      const text = element.textContent?.trim() || ''
      if (text.length > 0) {
        const level = parseInt(element.tagName.charAt(1))
        
        // 过滤掉非Chapter标题
        if (text.includes('Chapter') || text.includes('第') && text.includes('章')) {
          headings.push({ level, text, index })
          console.log(`📋 [DEBUG] HTML标题标签: Level ${level} - "${text}"`)
        }
      }
    })
    
    console.log(`📊 [DEBUG] 从HTML标题标签提取到 ${headings.length} 个Chapter标题`)
    return headings
  }

  // 新增：直接分析HTML文本内容
  private detectChaptersFromHTMLText(htmlContent: string): Array<{ level: number; text: string; index: number }> {
    console.log(`🔍 [DEBUG] 开始直接分析HTML文本内容检测章节`)
    
    const headings: Array<{ level: number; text: string; index: number }> = []
    
    // 移除HTML标签，获取纯文本
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log(`📄 [DEBUG] HTML文本内容长度: ${textContent.length}`)
    
    // 使用更宽松的Chapter检测模式
    const chapterPatterns = [
      /Chapter\s*\d+[:\s][^\n]*/gi,
      /第[一二三四五六七八九十\d]+章[^\n]*/gi,
      /Chapter\s*\d+[^\n]*/gi,
      /第[一二三四五六七八九十\d]+章[^\n]*/gi
    ]
    
    chapterPatterns.forEach((pattern, patternIndex) => {
      const matches = textContent.match(pattern)
      if (matches) {
        console.log(`📋 [DEBUG] HTML文本模式 ${patternIndex + 1} 找到 ${matches.length} 个匹配`)
        matches.forEach((match, _index) => {
          const text = match.trim()
          if (text.length > 0 && text.length < 200) {
            const level = 1
            headings.push({ level, text, index: headings.length })
            console.log(`📋 [DEBUG] HTML文本检测: Level ${level} - "${text}"`)
          }
        })
      } else {
        console.log(`📋 [DEBUG] HTML文本模式 ${patternIndex + 1} 未找到匹配`)
      }
    })
    
    console.log(`📊 [DEBUG] HTML文本分析检测到 ${headings.length} 个章节`)
    return headings
  }

  // 新增：最简单的正则表达式检测方法
  private detectChaptersWithSimpleRegex(htmlContent: string): Array<{ level: number; text: string; index: number }> {
    console.log(`🔍 [DEBUG] 开始使用最简单的正则表达式检测章节`)
    
    const headings: Array<{ level: number; text: string; index: number }> = []
    
    // 最简单的Chapter检测模式
    const simplePatterns = [
      /Chapter\s*\d+[:\s][^<]*/gi,
      /第[一二三四五六七八九十\d]+章[^<]*/gi
    ]
    
    simplePatterns.forEach((pattern, patternIndex) => {
      const matches = htmlContent.match(pattern)
      if (matches) {
        console.log(`📋 [DEBUG] 简单模式 ${patternIndex + 1} 找到 ${matches.length} 个匹配`)
        matches.forEach((match, _index) => {
          const text = match.trim()
          if (text.length > 0 && text.length < 200) {
            const level = text.includes('Chapter') ? 1 : 1
            headings.push({ level, text, index: headings.length })
            console.log(`📋 [DEBUG] 简单检测: Level ${level} - "${text}"`)
          }
        })
      }
    })
    
    console.log(`📊 [DEBUG] 简单正则表达式检测到 ${headings.length} 个章节`)
    return headings
  }

  // 新增：基于PDF成功经验的章节检测方法
  private detectChaptersFromText(textContent: string): Array<{ level: number; text: string; index: number }> {
    console.log(`🔍 [DEBUG] 开始基于文本内容的章节检测，文本长度: ${textContent.length}`)
    
    const headings: Array<{ level: number; text: string; index: number }> = []
    
    // 使用PDF处理器的成功模式
    const chapterPatterns = [
      /^第[一二三四五六七八九十\d]+章[\s\S]*$/m,
      /^Chapter\s+\d+[\s\S]*$/mi,
      /^第[一二三四五六七八九十\d]+节[\s\S]*$/m,
      /^\d+\.[\s\S]*$/m,
      /^[一二三四五六七八九十]、[\s\S]*$/m,
      // 新增：更具体的Chapter模式
      /^Chapter\s*\d+[:\s].*$/mi,
      /^Chapter\s*\d+.*$/mi
    ]
    
    // 将文本按段落分割 - 改进分割逻辑
    const paragraphs = textContent
      .split(/\n\s*\n/)  // 按双换行分割
      .map(p => p.trim())
      .filter(p => p.length > 0)
    
    // 如果分割结果太少，尝试其他分割方式
    if (paragraphs.length <= 1) {
      console.log(`⚠️ [DEBUG] 段落分割结果太少，尝试其他分割方式`)
      const altParagraphs = textContent
        .split(/\n/)  // 按单换行分割
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      if (altParagraphs.length > paragraphs.length) {
        console.log(`📋 [DEBUG] 使用单换行分割，得到 ${altParagraphs.length} 个段落`)
        paragraphs.length = 0
        paragraphs.push(...altParagraphs)
      }
    }
    
    console.log(`📋 [DEBUG] 文本分割为 ${paragraphs.length} 个段落`)
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.length < 50) return // 跳过太短的段落
      
      // 检查是否匹配章节模式
      for (const pattern of chapterPatterns) {
        const match = paragraph.match(pattern)
        if (match) {
          // 提取章节标题（取前100个字符作为标题）
          const titleMatch = paragraph.match(/^(.{1,100})/)
          const title = titleMatch ? titleMatch[1].trim() : `章节 ${headings.length + 1}`
          
          // 判断标题级别
          let level = 1
          if (paragraph.includes('第') && paragraph.includes('章')) {
            level = 1
          } else if (paragraph.includes('Chapter')) {
            level = 1
          } else if (paragraph.includes('第') && paragraph.includes('节')) {
            level = 2
          } else if (/^\d+\./.test(paragraph)) {
            level = 2
          }
          
          // 检查是否已经存在相同的标题
          const exists = headings.some(h => h.text === title)
          if (!exists) {
            headings.push({ level, text: title, index })
            console.log(`📋 [DEBUG] 检测到章节: Level ${level} - "${title}" (段落 ${index + 1})`)
          }
          break
        }
      }
    })
    
    console.log(`📊 [DEBUG] 基于文本内容检测到 ${headings.length} 个章节`)
    return headings
  }

  // 新增：基于文本内容的章节提取方法（借鉴PDF成功经验）
  private extractChaptersFromTextContent(textContent: string, headings: Array<{ level: number; text: string; index: number }>): ChapterData[] {
    console.log(`🔍 [DEBUG] 开始基于文本内容提取章节，找到 ${headings.length} 个标题`)
    
    const chapters: ChapterData[] = []
    // 改进段落分割逻辑
    let paragraphs = textContent.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0)
    
    // 如果分割结果太少，尝试其他分割方式
    if (paragraphs.length <= 1) {
      console.log(`⚠️ [DEBUG] 段落分割结果太少，尝试其他分割方式`)
      const altParagraphs = textContent
        .split(/\n/)  // 按单换行分割
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      if (altParagraphs.length > paragraphs.length) {
        console.log(`📋 [DEBUG] 使用单换行分割，得到 ${altParagraphs.length} 个段落`)
        paragraphs = altParagraphs
      }
    }
    
    console.log(`📋 [DEBUG] 章节提取使用 ${paragraphs.length} 个段落`)
    
    // 按标题级别过滤，主要关注1-2级标题
    const mainHeadings = headings.filter(h => h.level <= 2)
    console.log(`📋 [DEBUG] 主要标题数量: ${mainHeadings.length}`)
    
    if (mainHeadings.length === 0) {
      console.log(`⚠️ [DEBUG] 未找到主要标题，使用段落分组`)
      return this.extractChaptersFromParagraphs(paragraphs)
    }
    
    // 为每个主要标题创建章节
    for (let i = 0; i < mainHeadings.length; i++) {
      const heading = mainHeadings[i]
      const nextHeading = mainHeadings[i + 1]
      
      console.log(`🔍 [DEBUG] 处理标题 ${i + 1}/${mainHeadings.length}: "${heading.text}"`)
      
      // 找到标题在段落中的位置
      let headingIndex = paragraphs.findIndex(p => p.includes(heading.text))
      if (headingIndex === -1) {
        console.log(`⚠️ [DEBUG] 未找到标题 "${heading.text}" 在段落中的位置`)
        console.log(`🔍 [DEBUG] 尝试匹配的标题: "${heading.text}"`)
        console.log(`🔍 [DEBUG] 前5个段落内容:`)
        paragraphs.slice(0, 5).forEach((p, idx) => {
          console.log(`  段落${idx}: "${p.substring(0, 100)}..."`)
        })
        
        // 尝试更宽松的匹配
        const looseIndex = paragraphs.findIndex(p => 
          p.includes(heading.text.substring(0, 10)) || 
          heading.text.includes(p.substring(0, 10))
        )
        if (looseIndex !== -1) {
          console.log(`📋 [DEBUG] 使用宽松匹配找到标题 "${heading.text}" 在段落 ${looseIndex}`)
          headingIndex = looseIndex
        } else {
          console.log(`❌ [DEBUG] 完全无法找到标题 "${heading.text}" 的匹配`)
          console.log(`🔍 [DEBUG] 尝试更详细的匹配分析:`)
          paragraphs.forEach((p, idx) => {
            if (p.includes('Chapter') || p.includes('第')) {
              console.log(`  段落${idx}包含Chapter/第: "${p.substring(0, 100)}..."`)
            }
          })
          continue
        }
      } else {
        console.log(`✅ [DEBUG] 找到标题 "${heading.text}" 在段落 ${headingIndex}`)
      }
      
      // 计算章节内容范围
      const startIndex = headingIndex
      let endIndex = nextHeading ? 
        paragraphs.findIndex(p => p.includes(nextHeading.text)) : 
        paragraphs.length
      
      console.log(`📊 [DEBUG] 章节范围: 开始=${startIndex}, 结束=${endIndex}`)
      
      if (endIndex === -1) {
        console.log(`⚠️ [DEBUG] 未找到下一个标题 "${nextHeading?.text}" 的位置，使用文档末尾`)
        endIndex = paragraphs.length
      }
      
      // 验证章节范围
      if (startIndex >= endIndex) {
        console.log(`❌ [DEBUG] 章节范围无效: 开始=${startIndex}, 结束=${endIndex}`)
        console.log(`🔍 [DEBUG] 当前标题: "${heading.text}"`)
        console.log(`🔍 [DEBUG] 下一个标题: "${nextHeading?.text || '无'}"`)
        continue
      }
      
      // 提取章节内容
      const chapterContent = paragraphs
        .slice(startIndex, endIndex)
        .join('\n\n')
        .trim()
      
      console.log(`📄 [DEBUG] 章节内容长度: ${chapterContent.length} 字符`)
      console.log(`📄 [DEBUG] 章节内容预览: "${chapterContent.substring(0, 200)}..."`)
      
      if (chapterContent.length > 100) {
        chapters.push({
          id: `chapter-${chapters.length + 1}`,
          title: heading.text,
          content: chapterContent
        })
        console.log(`📖 [DEBUG] 成功提取章节: "${heading.text}" (${chapterContent.length} 字符)`)
      } else {
        console.log(`⚠️ [DEBUG] 章节内容太短，跳过: "${heading.text}" (${chapterContent.length} 字符)`)
        console.log(`🔍 [DEBUG] 章节内容详情: "${chapterContent}"`)
      }
    }
    
    console.log(`📊 [DEBUG] 基于文本内容提取到 ${chapters.length} 个章节`)
    return chapters
  }

  private shouldSkipChapter(title: string): boolean {
    if (!title) return false

    const normalizedTitle = title.toLowerCase().trim()
    return SKIP_CHAPTER_KEYWORDS.some(keyword =>
      normalizedTitle.includes(keyword.toLowerCase())
    )
  }
}
