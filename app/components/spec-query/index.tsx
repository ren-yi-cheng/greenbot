'use client'

import type { FC } from 'react'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import PdfCanvasViewer from './pdf-canvas-viewer'

type SpecCategory = '全部' | '国家标准' | '行业标准' | '地方标准'

interface SpecItem {
  id: string
  category: Exclude<SpecCategory, '全部'>
  tag: '国标' | '行标' | '地标'
  title: string
  code: string
  publisher: string
  year: string
  fileUrl: string
}

const categories: SpecCategory[] = ['全部', '国家标准', '行业标准', '地方标准']

const tagClassName: Record<SpecItem['tag'], string> = {
  国标: 'bg-[#edf9ef] text-[#169447]',
  行标: 'bg-[#eef6ff] text-[#2377c7]',
  地标: 'bg-[#fff7e8] text-[#c97812]',
}

interface ISpecQueryProps {
  isMobile?: boolean
}

const SpecQuery: FC<ISpecQueryProps> = ({ isMobile = false }) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SpecCategory>('全部')
  const [specs, setSpecs] = useState<SpecItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isReaderVisible, setIsReaderVisible] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadSpecs = async () => {
      setIsLoading(true)

      try {
        const response = await fetch('/api/specs', { cache: 'no-store' })
        const result = await response.json()
        const nextSpecs = (result.data || []) as SpecItem[]

        if (ignore) {
          return
        }

        setSpecs(nextSpecs)
        setSelectedId(isMobile ? null : nextSpecs[0]?.id || null)
      }
      finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadSpecs()

    return () => {
      ignore = true
    }
  }, [isMobile])

  const filteredSpecs = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return specs.filter((item) => {
      const matchesCategory = category === '全部' || item.category === category
      const matchesKeyword = !keyword || `${item.title} ${item.code} ${item.publisher}`.toLowerCase().includes(keyword)

      return matchesCategory && matchesKeyword
    })
  }, [category, query, specs])

  const selectedSpec = specs.find(item => item.id === selectedId) || filteredSpecs[0]
  const shouldShowList = !isMobile || !isReaderVisible
  const shouldShowReader = !isMobile || isReaderVisible

  return (
    <div className='flex h-full min-h-0 bg-white text-[#111827]'>
      {shouldShowList && (
        <section className={`${isMobile ? 'w-full border-r-0' : 'w-[560px] border-r'} flex h-full shrink-0 flex-col border-[#e7ebdf] bg-white`}>
          <div className={`${isMobile ? 'px-4 pb-3 pt-4' : 'px-[30px] pb-4 pt-4'} shrink-0`}>
            <h1 className={`${isMobile ? 'text-[26px] leading-8' : 'text-[24px] leading-8'} font-semibold text-[#06130c]`}>规范查询</h1>
            <p className={`${isMobile ? 'mt-1 text-[14px]' : 'mt-1 text-[13px]'} leading-5 text-[#53605a]`}>检索绿地规划相关的国家、行业、地方标准</p>

            <div className={`${isMobile ? 'mt-4' : 'mt-7'} flex h-[50px] items-center rounded-[22px] bg-[#f0f5ef] px-4`}>
              <MagnifyingGlassIcon className='h-5 w-5 shrink-0 text-[#607069]' />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='搜索规范名称或编号...'
                className='ml-3 h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#111827] outline-none placeholder:text-[#6f7d75]'
              />
            </div>

            <div className='mt-4 flex flex-wrap gap-2'>
              {categories.map(item => (
                <button
                  type='button'
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`h-[35px] rounded-full px-4 py-2 text-[14px] transition ${
                    category === item
                      ? 'bg-[#229347] text-white'
                      : 'bg-[#f0f5ef] text-[#4f5d56] hover:bg-[#e7efe5]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className='mt-5 flex items-center justify-between text-[14px]'>
              <span className='text-[#42514a]'>{isLoading ? '正在加载规范...' : `共 ${filteredSpecs.length} 部规范`}</span>
              <button type='button' className='flex items-center gap-1 text-[#229347]'>
                最新发布
                <ArrowDownIcon className='h-3.5 w-3.5' />
              </button>
            </div>
          </div>

          <div className={`${isMobile ? 'px-4' : 'px-[30px]'} min-h-0 flex-1 overflow-y-auto pb-6`}>
            <div className='space-y-3'>
              {!isLoading && filteredSpecs.length === 0 && (
                <div className='rounded-[20px] border border-[#e2e7df] px-5 py-6 text-center text-[14px] text-[#66736d]'>
                  未找到匹配的规范
                </div>
              )}
              {filteredSpecs.map((item) => {
                const isSelected = selectedId === item.id

                return (
                  <button
                    type='button'
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id)
                      if (isMobile) {
                        setIsReaderVisible(true)
                      }
                    }}
                    className={`w-full rounded-[26px] border bg-white px-5 py-5 text-left transition ${
                      isSelected
                        ? 'border-[#b6dfbd] shadow-[0_16px_36px_-32px_rgba(34,147,71,0.55)]'
                        : 'border-[#e2e7df] hover:border-[#c9dcc9]'
                    }`}
                  >
                    <div className='flex items-center gap-4'>
                      <div className='min-w-0 flex-1'>
                        <span className={`inline-flex rounded-[5px] px-2 py-0.5 text-[12px] ${tagClassName[item.tag]}`}>
                          {item.tag}
                        </span>
                        <div className='mt-3 truncate text-[18px] font-semibold leading-6 text-[#06130c]'>{item.title}</div>
                        <div className='mt-1 truncate text-[14px] leading-5 text-[#4f5d56]'>
                          {item.code} · {item.publisher} · {item.year}
                        </div>
                      </div>
                      <ChevronRightIcon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-[#229347]' : 'text-[#4f5d56]'}`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {shouldShowReader && (
        <section className={`${isMobile ? 'w-full px-4' : 'flex-1 px-8'} flex min-w-0 items-center justify-center bg-white`}>
          {selectedSpec
            ? (
              <div className={`${isMobile ? 'py-4' : 'py-6'} flex h-full min-h-0 w-full flex-col bg-white`}>
                {isMobile && (
                  <button
                    type='button'
                    onClick={() => setIsReaderVisible(false)}
                    className='mb-3 flex w-fit items-center gap-2 rounded-full bg-[#f0f5ef] px-3 py-2 text-[14px] font-medium text-[#229347]'
                  >
                    <ArrowLeftIcon className='h-4 w-4' />
                    返回列表
                  </button>
                )}
                <div className='mb-4 flex shrink-0 items-center justify-between gap-4'>
                  <div className='min-w-0'>
                    <div className={`${isMobile ? 'text-[17px]' : 'text-[20px]'} truncate font-semibold text-[#06130c]`}>{selectedSpec.title}</div>
                    <div className='mt-1 truncate text-[14px] text-[#53605a]'>
                      {selectedSpec.code ? `${selectedSpec.code} · ` : ''}{selectedSpec.publisher}{selectedSpec.year ? ` · ${selectedSpec.year}` : ''}
                    </div>
                  </div>
                  <a
                    href={selectedSpec.fileUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='shrink-0 rounded-full bg-[#f0f5ef] px-4 py-2 text-[14px] font-medium text-[#229347] transition hover:bg-[#e5efe3]'
                  >
                    新窗口打开
                  </a>
                </div>
                <div className='min-h-0 flex-1 overflow-hidden bg-white'>
                  <PdfCanvasViewer fileUrl={selectedSpec.fileUrl} />
                </div>
              </div>
            )
            : (
              <div className='flex items-center gap-3 text-[16px] text-[#53605a]'>
                <MagnifyingGlassIcon className='h-5 w-5 text-[#9aa69f]' />
                <span>从左侧选择一部规范查看</span>
              </div>
            )}
        </section>
      )}
    </div>
  )
}

export default React.memo(SpecQuery)
