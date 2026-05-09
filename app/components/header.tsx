import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'

export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}

const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-3">
      {isMobile
        ? (
          <div
            className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-[#dbe8d1] bg-[#f8fcf4] text-[#527249] transition hover:border-[#c9dfb7] hover:bg-white'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4" />
          </div>
        )
        : <div className='h-10 w-10' />}
      <div className='flex items-center space-x-3'>
        <AppIcon size="small" className='shadow-[0_12px_24px_-18px_rgba(99,188,70,0.35)]' />
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#648157]">AI Assistant</div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
      </div>
      {isMobile
        ? (
          <div className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-[#dbe8d1] bg-[#f8fcf4] text-[#527249] transition hover:border-[#c9dfb7] hover:bg-white' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4" />
          </div>)
        : <div className='h-10 w-10' />}
    </div>
  )
}

export default React.memo(Header)
