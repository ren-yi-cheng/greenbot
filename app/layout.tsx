import type { Metadata } from 'next'
import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

export const metadata: Metadata = {
  title: 'Chat App - greenbot',
  icons: {
    icon: '/brand-icon-square.png',
    shortcut: '/brand-icon-square.png',
    apple: '/brand-icon-square.png',
  },
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <body className="h-screen overflow-hidden">
        <div className="h-screen min-w-[300px] overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout
