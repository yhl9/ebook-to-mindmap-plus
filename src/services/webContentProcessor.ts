import { HtmlProcessor, type ChapterData, type BookData } from './htmlProcessor'

export interface WebContentData {
  url: string
  title: string
  content: string
  htmlContent: string
}

export class WebContentProcessor {
  private htmlProcessor = new HtmlProcessor()

  async fetchWebContent(url: string): Promise<WebContentData> {
    try {
      console.log(`🌐 [DEBUG] 开始获取网页内容: ${url}`)
      
      // 验证URL格式
      if (!this.isValidUrl(url)) {
        throw new Error('请输入有效的网页地址')
      }

      // 添加协议前缀（如果没有的话）
      const normalizedUrl = this.normalizeUrl(url)
      
      // 尝试多种方式获取网页内容
      let response: Response
      let htmlContent: string
      
      try {
        // 方式1：直接fetch（可能遇到CORS限制）
        response = await fetch(normalizedUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          mode: 'cors'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        htmlContent = await response.text()
      } catch (corsError) {
        console.warn(`⚠️ [DEBUG] 直接fetch失败，尝试代理方式:`, corsError)
        
        // 方式2：使用代理服务（如果直接fetch失败）
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(normalizedUrl)}`
          const proxyResponse = await fetch(proxyUrl)
          
          if (!proxyResponse.ok) {
            throw new Error(`代理请求失败: ${proxyResponse.status}`)
          }
          
          const proxyData = await proxyResponse.json()
          htmlContent = proxyData.contents
          
          if (!htmlContent) {
            throw new Error('代理服务返回空内容')
          }
        } catch (proxyError) {
          console.warn(`⚠️ [DEBUG] 代理方式也失败:`, proxyError)
          
          // 方式3：提供用户手动输入HTML的选项
          throw new Error(`无法自动获取网页内容。可能的原因：\n1. 网页存在CORS限制\n2. 需要登录或特殊权限\n3. 网络连接问题\n\n建议：\n1. 尝试复制网页内容并保存为HTML文件上传\n2. 使用浏览器开发者工具复制HTML源码\n3. 检查网页地址是否正确`)
        }
      }

      console.log(`🌐 [DEBUG] 网页内容获取完成，长度: ${htmlContent.length}`)

      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('网页内容为空，请检查URL是否正确')
      }

      // 解析HTML内容
      const title = this.extractTitle(htmlContent, normalizedUrl)
      const content = this.extractMainContent(htmlContent)

      console.log(`🌐 [DEBUG] 网页解析完成:`, {
        url: normalizedUrl,
        title,
        contentLength: content.length
      })

      return {
        url: normalizedUrl,
        title,
        content,
        htmlContent
      }
    } catch (error) {
      console.error(`❌ [DEBUG] 获取网页内容失败:`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('无法访问该网页，可能是网络问题或网页不存在')
        } else if (error.message.includes('CORS')) {
          throw new Error('由于CORS限制，无法直接访问该网页，请尝试其他方法')
        }
      }
      
      throw new Error(`获取网页内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async parseWebContent(url: string): Promise<BookData> {
    try {
      const webContent = await this.fetchWebContent(url)
      
      return {
        title: webContent.title,
        author: this.extractAuthor(webContent.htmlContent),
        totalPages: 1
      }
    } catch (error) {
      console.error(`❌ [DEBUG] 解析网页内容失败:`, error)
      throw new Error(`解析网页内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async extractChapters(url: string, useSmartDetection: boolean = false, skipNonEssentialChapters: boolean = true, _maxSubChapterDepth: number = 0): Promise<ChapterData[]> {
    try {
      console.log(`🌐 [DEBUG] 开始提取网页章节，智能检测: ${useSmartDetection}`)
      
      const webContent = await this.fetchWebContent(url)
      
      if (webContent.content.trim().length < 100) {
        throw new Error('提取的网页内容过少，请检查网页是否包含有效内容')
      }

      // 使用HTML处理器来提取章节
      const chapters = await this.htmlProcessor.extractChapters(
        this.createFileFromContent(webContent.htmlContent, webContent.title),
        useSmartDetection,
        skipNonEssentialChapters,
        _maxSubChapterDepth
      )

      console.log(`📊 [DEBUG] 网页章节提取完成，共 ${chapters.length} 个章节`)
      return chapters
    } catch (error) {
      console.error(`❌ [DEBUG] 提取网页章节失败:`, error)
      throw new Error(`提取网页章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  private normalizeUrl(url: string): string {
    // 如果URL没有协议，添加https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  private extractTitle(htmlContent: string, url: string): string {
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

      // 回退到URL域名
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch {
        return '网页内容'
      }
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取标题失败，使用默认标题:`, error)
      return '网页内容'
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

      return '网页作者'
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取作者失败:`, error)
      return '网页作者'
    }
  }

  private extractMainContent(htmlContent: string): string {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')

      // 移除不需要的元素
      const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, aside, .sidebar, .navigation, .menu, .advertisement, .ads')
      elementsToRemove.forEach(el => el.remove())

      // 尝试找到主要内容区域
      const mainSelectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '.post-content',
        '.entry-content',
        '#content',
        '.container'
      ]

      let mainElement = null
      for (const selector of mainSelectors) {
        mainElement = doc.querySelector(selector)
        if (mainElement) break
      }

      // 如果没有找到特定的主要内容区域，使用body
      if (!mainElement) {
        mainElement = doc.body
      }

      if (!mainElement) {
        throw new Error('无法找到主要内容区域')
      }

      // 获取纯文本内容
      let textContent = mainElement.textContent || ''
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      return textContent
    } catch (error) {
      console.warn(`⚠️ [DEBUG] 提取主要内容失败，使用简单文本提取:`, error)
      // 回退到简单的HTML标签移除
      return htmlContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
  }

  private createFileFromContent(htmlContent: string, title: string): File {
    // 创建一个临时的File对象，用于HTML处理器
    const blob = new Blob([htmlContent], { type: 'text/html' })
    return new File([blob], `${title}.html`, { type: 'text/html' })
  }
}
