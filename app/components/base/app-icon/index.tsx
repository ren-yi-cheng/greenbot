import type { FC } from 'react'
import Image from 'next/image'
import classNames from 'classnames'
import style from './style.module.css'

export interface AppIconProps {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large'
  rounded?: boolean
  icon?: string
  background?: string
  className?: string
}

const sizeMap = {
  xs: 12,
  tiny: 24,
  small: 32,
  medium: 36,
  large: 44,
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  icon = '/brand-icon.svg',
  className,
}) => {
  return (
    <span
      className={classNames(
        style.appIcon,
        size !== 'medium' && style[size],
        rounded && style.rounded,
        className ?? '',
      )}
    >
      <Image
        src={icon}
        alt="Brand logo"
        width={sizeMap[size]}
        height={sizeMap[size]}
        className='h-full w-full object-contain'
        priority={size === 'large'}
      />
    </span>
  )
}

export default AppIcon
