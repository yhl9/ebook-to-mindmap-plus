import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { WordTestHelper } from '../utils/wordTestHelper'
import { FileText, Bug, TestTube } from 'lucide-react'

interface WordDebugPanelProps {
  onTestComplete?: (results: any) => void
}

export function WordDebugPanel({ onTestComplete }: WordDebugPanelProps) {
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testResults, setTestResults] = useState<string>('')
  const [isTesting, setIsTesting] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      setTestFile(file)
      setTestResults('')
    }
  }

  const runTest = async () => {
    if (!testFile) return

    setIsTesting(true)
    setTestResults('开始测试...\n')

    // 捕获控制台输出
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    let output = ''

    console.log = (...args) => {
      output += args.join(' ') + '\n'
      originalLog(...args)
    }

    console.warn = (...args) => {
      output += '⚠️ ' + args.join(' ') + '\n'
      originalWarn(...args)
    }

    console.error = (...args) => {
      output += '❌ ' + args.join(' ') + '\n'
      originalError(...args)
    }

    try {
      await WordTestHelper.testWordDocument(testFile)
      setTestResults(output)
      
      if (onTestComplete) {
        onTestComplete({ file: testFile, results: output })
      }
    } catch (error) {
      setTestResults(output + '\n❌ 测试失败: ' + (error as Error).message)
    } finally {
      // 恢复原始控制台方法
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      setIsTesting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Word文档调试面板
        </CardTitle>
        <CardDescription>
          用于测试和调试Word文档解析功能
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="debug-file">选择Word文档进行测试</Label>
          <input
            id="debug-file"
            type="file"
            accept=".docx,.doc"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {testFile && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              已选择: {testFile.name} ({testFile.size} bytes)
            </div>
            
            <Button
              onClick={runTest}
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <TestTube className="mr-2 h-4 w-4 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  开始测试
                </>
              )}
            </Button>
          </div>
        )}

        {testResults && (
          <div className="space-y-2">
            <Label>测试结果</Label>
            <Textarea
              value={testResults}
              readOnly
              className="min-h-96 font-mono text-sm"
              placeholder="测试结果将显示在这里..."
            />
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>调试说明：</strong></p>
          <p>• 选择Word文档后点击"开始测试"</p>
          <p>• 查看测试结果中的HTML结构和标题检测信息</p>
          <p>• 根据调试信息调整Word文档格式</p>
          <p>• 建议使用Word的标准标题样式</p>
        </div>
      </CardContent>
    </Card>
  )
}
