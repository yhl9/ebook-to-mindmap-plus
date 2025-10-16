// Word文档测试助手
export class WordTestHelper {
  static async testWordDocument(file: File): Promise<void> {
    console.log('🧪 [Word测试] 开始测试Word文档解析')
    console.log('📄 [Word测试] 文件名:', file.name)
    console.log('📄 [Word测试] 文件大小:', file.size, 'bytes')
    
    try {
      // 测试mammoth解析
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      
      console.log('🔍 [Word测试] 开始mammoth解析...')
      const result = await mammoth.convertToHtml({ arrayBuffer })
      
      console.log('✅ [Word测试] mammoth解析成功')
      console.log('📄 [Word测试] HTML长度:', result.value.length)
      console.log('📄 [Word测试] 警告数量:', result.messages?.length || 0)
      
      if (result.messages && result.messages.length > 0) {
        console.log('⚠️ [Word测试] mammoth警告:')
        result.messages.forEach((message, index) => {
          console.log(`   ${index + 1}. ${message.message}`)
        })
      }
      
      // 分析HTML结构
      this.analyzeHTMLStructure(result.value)
      
      // 测试标题检测
      this.testHeadingDetection(result.value)
      
    } catch (error) {
      console.error('❌ [Word测试] 解析失败:', error)
    }
  }
  
  private static analyzeHTMLStructure(htmlContent: string): void {
    console.log('🔍 [Word测试] 分析HTML结构...')
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // 基本统计
    const allElements = doc.querySelectorAll('*')
    const paragraphs = doc.querySelectorAll('p')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const styledElements = doc.querySelectorAll('[style]')
    
    console.log('📊 [Word测试] HTML统计:')
    console.log(`   总元素数: ${allElements.length}`)
    console.log(`   段落数: ${paragraphs.length}`)
    console.log(`   标题标签数: ${headings.length}`)
    console.log(`   有样式的元素数: ${styledElements.length}`)
    
    // 分析段落内容
    console.log('📝 [Word测试] 段落内容分析:')
    for (let i = 0; i < Math.min(10, paragraphs.length); i++) {
      const p = paragraphs[i]
      const text = p.textContent?.trim() || ''
      const style = p.getAttribute('style') || ''
      
      if (text.length > 0) {
        console.log(`   段落 ${i + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`)
        console.log(`   样式: ${style}`)
        console.log(`   长度: ${text.length}`)
        console.log('   ---')
      }
    }
  }
  
  private static testHeadingDetection(htmlContent: string): void {
    console.log('🔍 [Word测试] 测试标题检测...')
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const paragraphs = doc.querySelectorAll('p')
    
    let detectedHeadings = 0
    
    paragraphs.forEach((p, index) => {
      const text = p.textContent?.trim() || ''
      const style = p.getAttribute('style') || ''
      
      if (text.length > 0 && text.length < 150) {
        // 检查是否可能是标题
        const isLikelyHeading = this.isLikelyHeading(text, style)
        
        if (isLikelyHeading) {
          detectedHeadings++
          console.log(`📋 [Word测试] 检测到标题 ${detectedHeadings}:`)
          console.log(`   内容: "${text}"`)
          console.log(`   样式: ${style}`)
          console.log(`   段落位置: ${index + 1}`)
          console.log('   ---')
        }
      }
    })
    
    console.log(`📊 [Word测试] 总共检测到 ${detectedHeadings} 个可能的标题`)
  }
  
  private static isLikelyHeading(text: string, style: string): boolean {
    // 检查文本长度
    if (text.length > 150) return false
    
    // 检查标题关键词
    const headingKeywords = [
      'Chapter', 'chapter', 'Introduction', 'introduction',
      'Conclusion', 'conclusion', 'Summary', 'summary',
      'Overview', 'overview', 'Getting Started', 'getting started',
      'What is', 'what is', 'How to', 'how to',
      'Step', 'step', 'Part', 'part', 'Section', 'section',
      'Table of Contents', 'Contents', 'contents',
      'About', 'about', 'Welcome', 'welcome',
      '第', '章', '节', '一、', '二、', '三、', '四、', '五、',
      '1.', '2.', '3.', '4.', '5.', '概述', '介绍', '总结', '结论'
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
    
    // 检查是否以数字或大写字母开头
    const startsWithNumber = /^[一二三四五六七八九十\d]/.test(text.trim())
    const startsWithCapital = /^[A-Z]/.test(text.trim())
    
    // 检查标题模式
    const hasTitlePattern = /^(Chapter|Part|Section|Step)\s*\d+/i.test(text.trim()) ||
                           /^\d+\.\s*[A-Z]/.test(text.trim()) ||
                           /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text.trim())
    
    return hasHeadingKeyword || hasHeadingStyle || startsWithNumber || 
           (startsWithCapital && text.length < 50) || hasTitlePattern
  }
}
