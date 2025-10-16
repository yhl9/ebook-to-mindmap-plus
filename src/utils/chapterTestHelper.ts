// Chapter检测测试助手
export class ChapterTestHelper {
  static testChapterDetection(text: string): { isChapter: boolean; level: number; reason: string } {
    console.log(`🔍 [Chapter测试] 测试文本: "${text}"`)
    
    // 测试各种Chapter模式
    const patterns = [
      { regex: /^Chapter\s*\d+[:\s]/i, level: 1, name: 'Chapter格式1' },
      { regex: /^Chapter\s*\d+/i, level: 1, name: 'Chapter格式2' },
      { regex: /^Chapter\s*\d+[:\s].*/i, level: 1, name: 'Chapter格式3' },
      { regex: /^\d+[\.\:]\s*[A-Z]/, level: 2, name: '数字编号格式' },
      { regex: /^\d+\.\s*[A-Z]/, level: 2, name: '数字点格式' }
    ]
    
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        console.log(`✅ [Chapter测试] 匹配成功: ${pattern.name}`)
        return {
          isChapter: true,
          level: pattern.level,
          reason: pattern.name
        }
      }
    }
    
    // 测试关键词匹配
    const keywords = [
      'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5',
      'Chapter 6', 'Chapter 7', 'Chapter 8', 'Chapter 9', 'Chapter 10',
      'chapter 1', 'chapter 2', 'chapter 3', 'chapter 4', 'chapter 5',
      'chapter 6', 'chapter 7', 'chapter 8', 'chapter 9', 'chapter 10'
    ]
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        console.log(`✅ [Chapter测试] 关键词匹配: ${keyword}`)
        return {
          isChapter: true,
          level: 1,
          reason: `关键词: ${keyword}`
        }
      }
    }
    
    console.log(`❌ [Chapter测试] 未匹配任何模式`)
    return {
      isChapter: false,
      level: 0,
      reason: '未匹配任何模式'
    }
  }
  
  static analyzeTextForChapters(text: string): void {
    console.log(`🔍 [Chapter分析] 分析文本中的Chapter模式`)
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    console.log(`📄 [Chapter分析] 总行数: ${lines.length}`)
    
    let chapterCount = 0
    const chapters: string[] = []
    
    lines.forEach((line, index) => {
      const result = this.testChapterDetection(line)
      if (result.isChapter) {
        chapterCount++
        chapters.push(line)
        console.log(`📋 [Chapter分析] 第${chapterCount}个Chapter: "${line}" (级别: ${result.level}, 原因: ${result.reason})`)
      }
    })
    
    console.log(`📊 [Chapter分析] 总共找到 ${chapterCount} 个Chapter`)
    console.log(`📋 [Chapter分析] Chapter列表:`, chapters)
  }
}
