// Word文档调试助手
export class WordDebugHelper {
  static analyzeHTMLStructure(htmlContent: string): void {
    console.log('🔍 [Word调试] 开始分析HTML结构')
    console.log('📄 [Word调试] HTML内容长度:', htmlContent.length)
    
    // 创建DOM解析器
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // 分析所有段落
    const allParagraphs = doc.querySelectorAll('p')
    console.log(`📋 [Word调试] 总段落数: ${allParagraphs.length}`)
    
    // 分析前20个段落的详细信息
    const maxParagraphsToAnalyze = Math.min(20, allParagraphs.length)
    console.log(`📋 [Word调试] 分析前 ${maxParagraphsToAnalyze} 个段落:`)
    
    for (let i = 0; i < maxParagraphsToAnalyze; i++) {
      const p = allParagraphs[i]
      const text = p.textContent?.trim() || ''
      const style = p.getAttribute('style') || ''
      
      if (text.length > 0) {
        console.log(`📝 [Word调试] 段落 ${i + 1}:`)
        console.log(`   内容: "${text}"`)
        console.log(`   样式: ${style}`)
        console.log(`   长度: ${text.length}`)
        
        // 检查是否可能是标题
        const isLikelyHeading = this.isLikelyHeading(text, style)
        console.log(`   可能是标题: ${isLikelyHeading}`)
        
        // 分析样式特征
        this.analyzeStyleFeatures(style)
        console.log('---')
      }
    }
    
    // 分析标题标签
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    console.log(`📋 [Word调试] HTML标题标签数量: ${headings.length}`)
    
    headings.forEach((h, index) => {
      const text = h.textContent?.trim() || ''
      console.log(`📋 [Word调试] HTML标题 ${index + 1}: "${text}" (${h.tagName})`)
    })
    
    // 分析样式化段落
    const styledParagraphs = doc.querySelectorAll('p[style]')
    console.log(`📋 [Word调试] 有样式的段落数量: ${styledParagraphs.length}`)
    
    // 分析字体大小
    const fontSizePatterns = [
      'font-size:18pt', 'font-size:16pt', 'font-size:14pt', 'font-size:12pt',
      'font-size:18px', 'font-size:16px', 'font-size:14px', 'font-size:12px',
      'font-size:24pt', 'font-size:20pt', 'font-size:22pt'
    ]
    
    fontSizePatterns.forEach(pattern => {
      const elements = doc.querySelectorAll(`p[style*="${pattern}"]`)
      if (elements.length > 0) {
        console.log(`📋 [Word调试] 找到 ${elements.length} 个 ${pattern} 的段落`)
        elements.forEach((el, index) => {
          const text = el.textContent?.trim() || ''
          console.log(`   ${index + 1}. "${text}"`)
        })
      }
    })
    
    // 分析粗体文本
    const boldElements = doc.querySelectorAll('p[style*="font-weight:bold"], p[style*="font-weight: bold"], strong, b')
    console.log(`📋 [Word调试] 粗体文本数量: ${boldElements.length}`)
    
    if (boldElements.length > 0) {
      console.log(`📋 [Word调试] 粗体文本示例:`)
      boldElements.forEach((el, index) => {
        if (index < 10) { // 只显示前10个
          const text = el.textContent?.trim() || ''
          console.log(`   ${index + 1}. "${text}"`)
        }
      })
    }
    
    // 分析可能的标题模式
    this.analyzeHeadingPatterns(allParagraphs)
  }
  
  private static analyzeStyleFeatures(style: string): void {
    if (style.includes('font-weight:bold') || style.includes('font-weight: bold')) {
      console.log(`   🔍 特征: 粗体`)
    }
    if (style.includes('font-size:')) {
      const fontSize = style.match(/font-size:\s*(\d+(?:\.\d+)?(?:pt|px))/i)
      if (fontSize) {
        console.log(`   🔍 特征: 字体大小 ${fontSize[1]}`)
      }
    }
    if (style.includes('text-align:center') || style.includes('text-align: center')) {
      console.log(`   🔍 特征: 居中对齐`)
    }
    if (style.includes('color:')) {
      console.log(`   🔍 特征: 有颜色设置`)
    }
  }
  
  private static analyzeHeadingPatterns(paragraphs: NodeListOf<Element>): void {
    console.log(`📋 [Word调试] 分析标题模式:`)
    
    const headingPatterns = [
      /^第[一二三四五六七八九十\d]+章/,
      /^Chapter\s*\d+/i,
      /^Chapter\s*\d+[:\s]/i,
      /^\d+\./,
      /^\d+[\.\:]/,
      /^[一二三四五六七八九十]、/,
      /^Introduction/i,
      /^Conclusion/i,
      /^Summary/i,
      /^Overview/i,
      /^Getting Started/i,
      /^What is/i,
      /^How to/i
    ]
    
    let foundPatterns = 0
    paragraphs.forEach((p, index) => {
      const text = p.textContent?.trim() || ''
      if (text.length > 0 && text.length < 100) {
        for (const pattern of headingPatterns) {
          if (pattern.test(text)) {
            console.log(`   📋 模式匹配: "${text}" (段落 ${index + 1})`)
            foundPatterns++
            break
          }
        }
      }
    })
    
    console.log(`📋 [Word调试] 找到 ${foundPatterns} 个可能的标题模式`)
  }
  
  private static isLikelyHeading(text: string, style: string): boolean {
    // 检查文本长度
    if (text.length > 100) return false
    
    // 检查标题关键词
    const headingKeywords = [
      '第', '章', '节', 'Chapter', 'chapter',
      '一、', '二、', '三、', '四、', '五、',
      '1.', '2.', '3.', '4.', '5.',
      '概述', '介绍', '总结', '结论'
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
    
    // 检查是否以数字开头
    const startsWithNumber = /^[一二三四五六七八九十\d]/.test(text.trim())
    
    return hasHeadingKeyword || hasHeadingStyle || startsWithNumber
  }
}
