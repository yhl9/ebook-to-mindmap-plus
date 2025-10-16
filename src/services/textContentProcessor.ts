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

export class TextContentProcessor {
  async parseText(textContent: string): Promise<BookData> {
    try {
      console.log(`📝 [DEBUG] 开始解析文本内容，长度: ${textContent.length}`)
      
      // 检查内容长度
      if (textContent.length > 2000) {
        throw new Error('文本内容超过2000字符限制')
      }

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('文本内容为空，请输入有效内容')
      }

      // 从文本中提取标题
      const title = this.extractTitle(textContent)
      const author = this.extractAuthor(textContent)

      console.log(`📝 [DEBUG] 文本解析完成:`, {
        title,
        author,
        contentLength: textContent.length
      })

      return {
        title,
        author,
        totalPages: 1
      }
    } catch (error) {
      console.error(`❌ [DEBUG] 文本解析失败:`, error)
      throw new Error(`解析文本内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async extractChapters(textContent: string, useSmartDetection: boolean = false, skipNonEssentialChapters: boolean = true, _maxSubChapterDepth: number = 0): Promise<ChapterData[]> {
    try {
      console.log(`📝 [DEBUG] 开始提取文本章节，智能检测: ${useSmartDetection}`)
      
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('文本内容为空，请输入有效内容')
      }

      const chapters: ChapterData[] = []

      if (useSmartDetection) {
        // 使用智能章节检测
        const detectedChapters = this.detectChapters(textContent)
        chapters.push(...detectedChapters)
      } else {
        // 简单按段落分组
        const paragraphs = this.splitIntoParagraphs(textContent)
        
        if (paragraphs.length === 0) {
          throw new Error('无法从文本中提取段落内容')
        }
        
        // 将段落按一定数量分组为章节
        const paragraphsPerChapter = Math.max(1, Math.floor(paragraphs.length / 3))
        
        for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
          const endIndex = Math.min(i + paragraphsPerChapter, paragraphs.length)
          const chapterContent = paragraphs.slice(i, endIndex).join('\n\n').trim()
          
          if (chapterContent.length > 50) {
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
        throw new Error('未找到有效的章节内容，请检查文本是否包含可识别的章节结构')
      }

      return filteredChapters
    } catch (error) {
      console.error(`❌ [DEBUG] 提取章节失败:`, error)
      throw new Error(`提取章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private extractTitle(textContent: string): string {
    try {
      // 尝试从文本中提取标题
      const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      // 查找可能的标题（第一行或包含特定关键词的行）
      for (const line of lines.slice(0, 3)) {
        if (line.length > 5 && line.length < 100) {
          // 检查是否包含标题关键词
          if (this.isLikelyTitle(line)) {
            return line
          }
        }
      }
      
      // 如果没有找到合适的标题，使用第一行或默认标题
      const firstLine = lines[0]
      if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
        return firstLine
      }
      
      return '文本内容'
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取标题失败，使用默认标题:`, error)
      return '文本内容'
    }
  }

  private extractAuthor(textContent: string): string {
    try {
      // 尝试从文本中提取作者信息
      const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      // 查找包含作者关键词的行
      const authorKeywords = ['作者', 'Author', 'by', 'BY', '作者：', 'Author:', 'By:', 'by:']
      
      for (const line of lines.slice(0, 5)) {
        for (const keyword of authorKeywords) {
          if (line.includes(keyword)) {
            // 提取作者名称
            const authorMatch = line.match(new RegExp(`${keyword}\\s*[:：]?\\s*(.+)`, 'i'))
            if (authorMatch && authorMatch[1].trim()) {
              return authorMatch[1].trim()
            }
          }
        }
      }
      
      return '文本作者'
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取作者失败:`, error)
      return '文本作者'
    }
  }

  private isLikelyTitle(text: string): boolean {
    // 检查是否可能是标题
    const titleKeywords = [
      '标题', 'Title', '题目', '主题', 'Subject',
      '第', '章', 'Chapter', 'Part', 'Section',
      '概述', 'Introduction', '总结', 'Summary',
      '结论', 'Conclusion', '前言', 'Preface'
    ]
    
    return titleKeywords.some(keyword => text.includes(keyword)) ||
           (text.length > 5 && text.length < 50 && /^[A-Z\u4e00-\u9fa5]/.test(text))
  }

  private splitIntoParagraphs(textContent: string): string[] {
    // 按段落分割文本
    return textContent
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
  }

  private detectChapters(textContent: string): ChapterData[] {
    console.log(`🧠 [DEBUG] 启用文本智能章节检测，文本长度: ${textContent.length}`)

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
      if (paragraph.length < 20) continue // 跳过太短的段落

      // 检查是否是新章节的开始
      let isNewChapter = false
      let chapterTitle = ''

      for (const pattern of chapterPatterns) {
        const match = paragraph.match(pattern)
        if (match) {
          // 提取章节标题（取前100个字符作为标题）
          const titleMatch = paragraph.match(/^(.{1,100})/)
          chapterTitle = titleMatch ? titleMatch[1].trim() : `章节 ${chapterCount + 1}`
          isNewChapter = true
          break
        }
      }

      if (isNewChapter || !currentChapter) {
        // 保存上一个章节
        if (currentChapter && currentChapter.content.trim().length > 50) {
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
    if (currentChapter && currentChapter.content.trim().length > 50) {
      chapters.push({
        id: `chapter-${chapterCount}`,
        title: currentChapter.title,
        content: currentChapter.content.trim()
      })
    }

    console.log(`🔍 [DEBUG] 文本章节检测完成，找到 ${chapters.length} 个章节`)

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
