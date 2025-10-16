import { SKIP_CHAPTER_KEYWORDS } from './constants'

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

export class HtmlProcessor {
  async parseHtml(file: File): Promise<BookData> {
    try {
      console.log(`📚 [DEBUG] 开始解析HTML文件: ${file.name}, 大小: ${file.size} bytes`)
      
      // 检查文件大小
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('文件过大，请选择小于10MB的HTML文档')
      }

      // 读取文件内容
      const htmlContent = await file.text()
      console.log(`📚 [DEBUG] HTML内容读取完成，长度: ${htmlContent.length}`)

      // 检查内容是否为空
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('HTML文档内容为空，请检查文档是否包含有效内容')
      }

      // 从HTML中提取标题
      const title = this.extractTitle(htmlContent, file.name)
      const author = this.extractAuthor(htmlContent)

      console.log(`📚 [DEBUG] HTML解析完成:`, {
        title,
        author,
        contentLength: htmlContent.length
      })

      return {
        title,
        author,
        totalPages: 1 // HTML文档没有固定页数概念
      }
    } catch (error) {
      console.error(`❌ [DEBUG] HTML解析失败:`, error)
      throw new Error(`解析HTML文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async extractChapters(file: File, useSmartDetection: boolean = false, skipNonEssentialChapters: boolean = true, _maxSubChapterDepth: number = 0): Promise<ChapterData[]> {
    try {
      console.log(`📚 [DEBUG] 开始提取HTML章节，智能检测: ${useSmartDetection}`)
      
      const htmlContent = await file.text()
      console.log(`📚 [DEBUG] HTML内容提取完成，长度: ${htmlContent.length}`)

      // 检查内容是否为空
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('HTML文档内容为空，请检查文档是否包含有效内容')
      }

      const chapters: ChapterData[] = []

      // 使用结构化内容提取，包括标题信息
      const { textContent, headings } = this.extractStructuredContent(htmlContent)
      
      if (textContent.trim().length < 100) {
        throw new Error('提取的文本内容过少，请检查HTML文档格式')
      }
      
      if (useSmartDetection) {
        // 优先使用基于文本内容的章节检测
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
          throw new Error('无法从HTML文档中提取段落内容')
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
        throw new Error('未找到有效的章节内容，请检查HTML文档是否包含可识别的章节结构')
      }

      return filteredChapters
    } catch (error) {
      console.error(`❌ [DEBUG] 提取章节失败:`, error)
      throw new Error(`提取章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private extractTitle(htmlContent: string, fileName: string): string {
    try {
      // 尝试从HTML中提取标题
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1].trim()) {
        return titleMatch[1].trim()
      }

      // 尝试从h1标签中提取标题
      const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i)
      if (h1Match && h1Match[1].trim()) {
        return h1Match[1].trim()
      }

      // 回退到文件名
      return fileName.replace(/\.(html?|htm)$/i, '') || '未知标题'
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取标题失败，使用文件名:`, error)
      return fileName.replace(/\.(html?|htm)$/i, '') || '未知标题'
    }
  }

  private extractAuthor(htmlContent: string): string {
    try {
      // 尝试从meta标签中提取作者
      const authorMatch = htmlContent.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i)
      if (authorMatch && authorMatch[1].trim()) {
        return authorMatch[1].trim()
      }

      // 尝试从其他可能的作者标签中提取
      const authorPatterns = [
        /<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["'][^>]*>/i,
        /<meta[^>]*property=["']og:article:author["'][^>]*content=["']([^"']+)["'][^>]*>/i,
        /<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)<\/span>/i,
        /<div[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)<\/div>/i
      ]

      for (const pattern of authorPatterns) {
        const match = htmlContent.match(pattern)
        if (match && match[1].trim()) {
          return match[1].trim()
        }
      }

      return '未知作者'
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取作者失败:`, error)
      return '未知作者'
    }
  }

  private extractStructuredContent(htmlContent: string): { textContent: string; headings: Array<{ level: number; text: string; index: number }> } {
    try {
      console.log(`🔍 [DEBUG] 开始提取结构化内容，HTML长度: ${htmlContent.length}`)

      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')

      // 检查解析错误
      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        console.warn(`⚠️ [DEBUG] DOM解析出现错误，将使用正则表达式备选方案:`, parseError.textContent)
        throw new Error('DOM解析失败')
      }

      // 移除脚本和样式标签
      const scripts = doc.querySelectorAll('script, style, nav, header, footer')
      scripts.forEach(el => el.remove())

      // 获取纯文本内容
      let textContent = doc.body?.textContent || ''
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      // 提取HTML标题标签
      const headings = this.extractHeadingsFromHTML(doc)
      console.log(`📋 [DEBUG] 从HTML标题标签提取到 ${headings.length} 个标题`)

      console.log(`✨ [DEBUG] 结构化内容提取完成，文本长度: ${textContent.length}, 标题数量: ${headings.length}`)

      return { textContent, headings }
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 结构化内容提取失败，使用普通文本提取:`, error)
      return { 
        textContent: this.extractTextWithRegex(htmlContent), 
        headings: [] 
      }
    }
  }

  private extractHeadingsFromHTML(doc: Document): Array<{ level: number; text: string; index: number }> {
    console.log(`🔍 [DEBUG] 开始从HTML标题标签提取标题`)
    
    const headings: Array<{ level: number; text: string; index: number }> = []
    
    // 提取所有HTML标题标签
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    console.log(`📋 [DEBUG] 找到 ${headingElements.length} 个HTML标题标签`)
    
    headingElements.forEach((element, index) => {
      const text = element.textContent?.trim() || ''
      if (text.length > 0) {
        const level = parseInt(element.tagName.charAt(1))
        
        // 过滤掉非章节标题（如导航、页脚等）
        if (!this.isNavigationHeading(text)) {
          headings.push({ level, text, index })
          console.log(`📋 [DEBUG] HTML标题标签: Level ${level} - "${text}"`)
        }
      }
    })
    
    console.log(`📊 [DEBUG] 从HTML标题标签提取到 ${headings.length} 个有效标题`)
    return headings
  }

  private isNavigationHeading(text: string): boolean {
    const navigationKeywords = [
      'navigation', 'nav', 'menu', 'sidebar', 'footer', 'header',
      'navigation', '导航', '菜单', '侧边栏', '页脚', '页眉',
      'table of contents', 'contents', '目录', 'toc'
    ]
    
    const lowerText = text.toLowerCase()
    return navigationKeywords.some(keyword => lowerText.includes(keyword))
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

  private detectChapters(textContent: string): ChapterData[] {
    console.log(`🧠 [DEBUG] 启用HTML智能章节检测，文本长度: ${textContent.length}`)

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

    console.log(`🔍 [DEBUG] HTML章节检测完成，找到 ${chapters.length} 个章节`)

    return chapters
  }

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

  private shouldSkipChapter(title: string): boolean {
    if (!title) return false

    const normalizedTitle = title.toLowerCase().trim()
    return SKIP_CHAPTER_KEYWORDS.some(keyword =>
      normalizedTitle.includes(keyword.toLowerCase())
    )
  }
}
