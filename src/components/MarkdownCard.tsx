import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CopyButton } from '@/components/ui/copy-button'
import { ViewContentDialog } from './ViewContentDialog'
import { useTranslation } from 'react-i18next'

interface MarkdownCardProps {
  /** 章节ID */
  id: string
  /** 章节标题 */
  title: string
  /** 章节内容（原始内容） */
  content: string
  /** Markdown格式的总结内容 */
  markdownContent: string
  /** 章节索引 */
  index: number
  /** 清除缓存的回调函数 */
  onClearCache?: (chapterId: string) => void
  /** 是否显示清除缓存按钮 */
  showClearCache?: boolean
  /** 是否显示查看内容按钮 */
  showViewContent?: boolean
  /** 是否显示复制按钮 */
  showCopyButton?: boolean
  /** 自定义类名 */
  className?: string
}

export const MarkdownCard: React.FC<MarkdownCardProps> = ({
  id,
  title,
  content,
  markdownContent,
  index,
  onClearCache,
  showClearCache = true,
  showViewContent = true,
  showCopyButton = true,
  className = ''
}) => {
  const { t } = useTranslation()

  return (
    <Card className={`gap-0 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline"># {index + 1}</Badge>
            {title}
          </div>
          <div className="flex items-center gap-2">
            {showCopyButton && (
              <CopyButton
                content={markdownContent}
                successMessage={t('common.copiedToClipboard')}
                title={t('common.copyChapterSummary')}
              />
            )}
            {showClearCache && onClearCache && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onClearCache(id)}
                title={t('common.clearCache')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {showViewContent && (
              <ViewContentDialog
                title={title}
                content={content}
                chapterIndex={index}
              />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent || ''}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}
