import React from 'react'
import Image from 'next/image'

import './style.css'

interface ILoadingProps {
  type?: 'area' | 'app'
}
const Loading = (
  { type = 'area' }: ILoadingProps = { type: 'area' },
) => {
  return (
    <div className={`flex w-full items-center justify-center ${type === 'app' ? 'h-full bg-white' : ''}`}>
      <div className={`loading-logo-wrap ${type === 'app' ? 'loading-logo-wrap-app' : ''}`}>
        <Image
          src="/brand-icon.svg"
          alt="Loading"
          width={type === 'app' ? 72 : 28}
          height={type === 'app' ? 72 : 28}
          className="loading-logo"
          priority={type === 'app'}
        />
      </div>
    </div>
  )
}

export default Loading
