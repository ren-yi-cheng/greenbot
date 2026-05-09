'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
}

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, imgSrcs }) => {
  const userName = ''
  return (
    <div className='flex items-start justify-end gap-4' key={id}>
      <div className='max-w-[72%]'>
        <div className='relative text-sm text-gray-900'>
          <div className='rounded-[14px] bg-[#2f9e44] px-5 py-4 text-[15px] leading-7 text-white shadow-[0_18px_40px_-32px_rgba(47,158,68,0.65)]'>
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      {useCurrentUserAvatar
        ? (
          <div className='h-10 w-10 shrink-0 rounded-full bg-[#b9e8b9] text-center leading-10 text-[#2f9e44]'>
            {userName?.[0].toLocaleUpperCase()}
          </div>
        )
        : (
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dff4df] text-[12px] font-semibold text-[#2f9e44]'>Me</div>
        )}
    </div>
  )
}

export default React.memo(Question)
