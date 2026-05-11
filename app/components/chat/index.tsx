'use client'

import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  feedbackDisabled?: boolean
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  isMobile?: boolean
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => {},
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
  isMobile = false,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const currentQuery = queryRef.current
    if (!currentQuery || currentQuery.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend()))
      return

    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)

    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }

    const imageFiles: VisionFile[] = files
      .filter(file => file.progress !== -1)
      .map(fileItem => ({
        type: 'image',
        transfer_method: fileItem.type,
        url: fileItem.url,
        upload_file_id: fileItem.fileId,
      }))

    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]

    onSend(queryRef.current, combinedFiles)

    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length)
        onClear()

      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }

    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId))
      setAttachmentFiles([])
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey && !isUseInputMethod.current)
        handleSend()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    isUseInputMethod.current = (e.nativeEvent as any).isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  return (
    <div className={cn(!feedbackDisabled && (isMobile ? 'px-3' : 'px-6 md:px-8'), 'flex h-full min-h-0 flex-col')}>
      <div className={cn('flex-1 overflow-y-auto', isMobile ? 'space-y-6 pb-4 pt-3' : 'space-y-8 pb-6 pt-6')}>
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return (
              <Answer
                key={item.id}
                item={item}
                feedbackDisabled={feedbackDisabled}
                onFeedback={onFeedback}
                isResponding={isResponding && isLast}
                suggestionClick={suggestionClick}
              />
            )
          }

          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={item.message_files?.length ? item.message_files.map(file => file.url) : []}
            />
          )
        })}
      </div>

      {!isHideSendInput && (
        <div className={cn('shrink-0', isMobile ? 'pb-4 pt-2' : 'pb-5 pt-3')}>
          <div className={cn('mx-auto', isMobile ? 'max-w-full' : 'max-w-[980px]')}>
            <div className={cn(
              'border border-[#daddd7] bg-white shadow-[0_20px_42px_-30px_rgba(15,23,42,0.16)]',
              isMobile ? 'rounded-[24px] px-4 py-3' : 'rounded-[20px] px-4 py-3',
            )}>
              {visionConfig?.enabled && (
                <div className="mb-2">
                  <div className="flex items-center gap-3">
                    <ChatImageUploader
                      settings={visionConfig}
                      onUpload={onUpload}
                      disabled={files.length >= visionConfig.number_limits}
                    />
                    <div className="h-4 w-px bg-[#e6e9e4]" />
                    <div className="min-w-0 flex-1">
                      <ImageList
                        list={files}
                        onRemove={onRemove}
                        onReUpload={onReUpload}
                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                        onImageLinkLoadError={onImageLinkLoadError}
                      />
                    </div>
                  </div>
                </div>
              )}

              {fileConfig?.enabled && (
                <div className="mb-2">
                  <FileUploaderInAttachmentWrapper
                    fileConfig={fileConfig}
                    value={attachmentFiles}
                    onChange={setAttachmentFiles}
                  />
                </div>
              )}

              <div className="relative">
                <Textarea
                  className={cn(
                    'block w-full max-h-none resize-none appearance-none bg-transparent text-slate-800 outline-none',
                    isMobile
                      ? 'px-3 py-3 pr-[84px] text-[16px] leading-7'
                      : 'px-4 py-3 pr-[106px] text-[15px] leading-7',
                  )}
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  placeholder={t('app.chat.startChat')}
                />
                <div className={cn('pointer-events-none absolute inset-y-0 flex items-center', isMobile ? 'right-2' : 'right-3')}>
                  <div className={cn('pointer-events-auto flex items-center', isMobile ? 'gap-2' : 'gap-3')}>
                    <div className={`${s.count} text-xs leading-5 text-slate-400`}>{query.trim().length}</div>
                    <Tooltip
                      selector="send-tip"
                      htmlContent={(
                        <div>
                          <div>{t('common.operation.send')} Enter</div>
                          <div>{t('common.operation.lineBreak')} Shift Enter</div>
                        </div>
                      )}
                    >
                      <button
                        type="button"
                        className={`${s.sendBtn} flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#74a86f] text-[20px] font-semibold text-white transition hover:bg-[#689963]`}
                        onClick={handleSend}
                        aria-label={t('common.operation.send')}
                      >
                        {`>`}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn('text-center text-[12px] text-[#b3b8bf]', isMobile ? 'mt-2 pb-1' : 'mt-2')}>
              AI may produce inaccurate information. Please verify important details carefully.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Chat)
