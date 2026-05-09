import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import type { ConversationItem } from '@/types/app'
import Image from 'next/image'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export interface ISidebarProps {
  currentId: string
  mode: 'dashboard' | 'chat'
  onCurrentIdChange: (id: string) => void
  onDashboardClick?: () => void
  onChatbotClick?: () => void
  list: ConversationItem[]
}

const Sidebar: FC<ISidebarProps> = ({
  currentId,
  mode,
  onCurrentIdChange,
  onDashboardClick,
  onChatbotClick,
  list,
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full shrink-0 flex-col border-r border-[#e7ebdf] bg-white pc:w-[320px] tablet:w-[280px] mobile:w-[280px]">
      <div className='flex justify-center px-8 pb-8 pt-10'>
        <div className='flex items-center gap-5'>
          <Image src='/brand-icon.png' alt='greenbot' width={52} height={52} className='h-[52px] w-[52px] object-contain' />
          <div className='text-[18px] font-semibold tracking-[-0.04em] text-[#171717]'>greenbot</div>
        </div>
      </div>

      <div className='border-t border-[#eef1ea]' />

      <div className='space-y-2 px-5 py-6'>
        <button
          type='button'
          onClick={onDashboardClick || (() => onCurrentIdChange('-1'))}
          className={classNames(
            mode === 'dashboard'
              ? 'bg-[#2f9e44] text-white shadow-[0_10px_24px_-18px_rgba(47,158,68,0.85)]'
              : 'text-[#6b7280] hover:bg-[#f7f9f5]',
            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-medium transition',
          )}
        >
          <Squares2X2Icon className='h-5 w-5' />
          <span>Dashboard</span>
        </button>
        <button
          type='button'
          onClick={onChatbotClick || (() => onCurrentIdChange(currentId || '-1'))}
          className={classNames(
            mode === 'chat'
              ? 'bg-[#2f9e44] text-white shadow-[0_10px_24px_-18px_rgba(47,158,68,0.85)]'
              : 'text-[#6b7280] hover:bg-[#f7f9f5]',
            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-medium transition',
          )}
        >
          <ChatBubbleBottomCenterTextIcon className='h-5 w-5' />
          <span>AI Chatbot</span>
        </button>
      </div>

      {mode === 'chat' && (
        <>
          <div className='px-7 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b0b5bd]'>
            History
          </div>

          <div className='flex-1 overflow-y-auto px-5 pb-5'>
            <div className='space-y-1'>
              {list.length === 0 && (
                <div className='px-3 py-3 text-[14px] text-[#98a2b3]'>
                  No conversations yet
                </div>
              )}
              {list.map((item) => {
                const isCurrent = item.id === currentId
                return (
                  <button
                    type='button'
                    key={item.id}
                    onClick={() => onCurrentIdChange(item.id)}
                    className={classNames(
                      isCurrent
                        ? 'bg-[#f2f7f1] text-[#171717]'
                        : 'text-[#6b7280] hover:bg-[#f7f9f5]',
                      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] transition',
                    )}
                  >
                    <ChatBubbleOvalLeftEllipsisIcon className={classNames(isCurrent ? 'text-[#2f9e44]' : 'text-[#98a2b3]', 'h-4 w-4 shrink-0')} />
                    <span className='truncate'>{item.name || t('app.chat.newChatDefaultName')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(Sidebar)
