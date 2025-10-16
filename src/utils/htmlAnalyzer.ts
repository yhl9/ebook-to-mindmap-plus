// HTML分析工具
export class HTMLAnalyzer {
  static analyzeHTMLContent(htmlContent: string): void {
    console.log('🔍 [HTML分析] 开始分析HTML内容')
    console.log('📄 [HTML分析] HTML长度:', htmlContent.length)
    
    // 分析HTML结构
    this.analyzeHTMLStructure(htmlContent)
    
    // 分析Chapter模式
    this.analyzeChapterPatterns(htmlContent)
    
    // 分析段落结构
    this.analyzeParagraphStructure(htmlContent)
  }
  
  private static analyzeHTMLStructure(htmlContent: string): void {
    console.log('🔍 [HTML分析] 分析HTML结构')
    
    // 统计标签
    const tagCounts: { [key: string]: number } = {}
    const tagMatches = htmlContent.match(/<\/?(\w+)[^>]*>/g)
    if (tagMatches) {
      tagMatches.forEach(tag => {
        const tagName = tag.match(/<\/?(\w+)/)?.[1]
        if (tagName) {
          tagCounts[tagName] = (tagCounts[tagName] || 0) + 1
        }
      })
    }
    
    console.log('📊 [HTML分析] 标签统计:', tagCounts)
    
    // 分析段落
    const pMatches = htmlContent.match(/<p[^>]*>.*?<\/p>/gi)
    console.log(`📋 [HTML分析] 段落数量: ${pMatches?.length || 0}`)
    
    // 分析标题
    const hMatches = htmlContent.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi)
    console.log(`📋 [HTML分析] 标题数量: ${hMatches?.length || 0}`)
    
    if (hMatches) {
      hMatches.forEach((h, index) => {
        const text = h.replace(/<[^>]*>/g, '').trim()
        console.log(`📋 [HTML分析] 标题 ${index + 1}: "${text}"`)
      })
    }
  }
  
  private static analyzeChapterPatterns(htmlContent: string): void {
    console.log('🔍 [HTML分析] 分析Chapter模式')
    
    const chapterPatterns = [
      /Chapter\s*\d+[:\s][^<]*/gi,
      /第[一二三四五六七八九十\d]+章[^<]*/gi,
      /<p[^>]*>.*?Chapter\s*\d+[:\s].*?<\/p>/gi,
      /<h[1-6][^>]*>.*?Chapter\s*\d+[:\s].*?<\/h[1-6]>/gi
    ]
    
    chapterPatterns.forEach((pattern, index) => {
      const matches = htmlContent.match(pattern)
      if (matches) {
        console.log(`📋 [HTML分析] 模式 ${index + 1} 找到 ${matches.length} 个匹配:`)
        matches.forEach((match, matchIndex) => {
          const text = match.replace(/<[^>]*>/g, '').trim()
          console.log(`   ${matchIndex + 1}. "${text}"`)
        })
      }
    })
  }
  
  private static analyzeParagraphStructure(htmlContent: string): void {
    console.log('🔍 [HTML分析] 分析段落结构')
    
    const pMatches = htmlContent.match(/<p[^>]*>.*?<\/p>/gi)
    if (pMatches) {
      console.log(`📋 [HTML分析] 分析前10个段落:`)
      pMatches.slice(0, 10).forEach((p, index) => {
        const text = p.replace(/<[^>]*>/g, '').trim()
        const style = p.match(/style="([^"]*)"/)?.[1] || ''
        console.log(`📝 [HTML分析] 段落 ${index + 1}:`)
        console.log(`   内容: "${text}"`)
        console.log(`   样式: ${style}`)
        console.log(`   长度: ${text.length}`)
        console.log('   ---')
      })
    }
  }
}
