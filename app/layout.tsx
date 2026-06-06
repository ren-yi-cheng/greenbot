import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

const googleSansFlex = localFont({
  src: [
    {
      path: '../Google_Sans_Flex/static/GoogleSansFlex_72pt-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../Google_Sans_Flex/static/GoogleSansFlex_72pt-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../Google_Sans_Flex/static/GoogleSansFlex_72pt-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-google-sans-flex',
})

const sourceHanSansSC = localFont({
  src: [
    {
      path: '../SourceHanSansSC/OTF/SimplifiedChinese/SourceHanSansSC-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../SourceHanSansSC/OTF/SimplifiedChinese/SourceHanSansSC-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../SourceHanSansSC/OTF/SimplifiedChinese/SourceHanSansSC-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-source-han-sans-sc',
})

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
      <body className={`${googleSansFlex.variable} ${sourceHanSansSC.variable} h-screen overflow-hidden`}>
        <div className="h-screen min-w-[300px] overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout
