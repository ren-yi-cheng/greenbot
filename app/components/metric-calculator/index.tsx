'use client'

import type { FC } from 'react'
import React, { useState } from 'react'
import {
  ArrowDownTrayIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Uploader from '@/app/components/base/image-uploader/uploader'
import Toast from '@/app/components/base/toast'
import { deleteConversation, sendChatMessage } from '@/service'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

type MetricPanel = 'parcel' | 'guide' | 'formula' | 'verify'

interface IMetricCalculatorProps {
  isMobile?: boolean
}

interface RecognizedColor {
  hex: string
  count: number
  percentage: number
}

interface RecommendedIndicator {
  name: string
  value: string
  basis: string
  reason: string
}

const tabs = [
  {
    key: 'parcel',
    title: '地块识别',
    desc: '地块识别 · 一键生成经济技术指标表',
    icon: ScanIcon,
  },
  {
    key: 'guide',
    title: '指标导引',
    desc: '输入项目信息 · 告知要关注的指标',
    icon: MagnifyingGlassIcon,
  },
  {
    key: 'formula',
    title: '公式查询',
    desc: '规范公式速查 · 内嵌即时计算器',
    icon: CalculatorIcon,
  },
  {
    key: 'verify',
    title: 'AI 核验',
    desc: '核验看板 · 优化建议 · 一键生成核验报告',
    icon: ShieldCheckIcon,
  },
] as const

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <path d='M8 4H5a1 1 0 0 0-1 1v3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M16 4h3a1 1 0 0 1 1 1v3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M20 16v3a1 1 0 0 1-1 1h-3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M8 20H5a1 1 0 0 1-1-1v-3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M10 12h4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  )
}

function CloudUploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <path
        d='M7.9 17.6H7.2a3.95 3.95 0 0 1-.48-7.88 5.52 5.52 0 0 1 10.62 1.68A3.38 3.38 0 0 1 16.95 17.6h-.98'
        stroke='currentColor'
        strokeWidth='1.85'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path d='M12 18V11.6' stroke='currentColor' strokeWidth='1.85' strokeLinecap='round' />
      <path d='M9.2 14.35 12 11.55l2.8 2.8' stroke='currentColor' strokeWidth='1.85' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

const landUseTypeOptions = ['公园绿地', '防护绿地', '广场用地', '附属绿地', '区域绿地']

const shanghaiDistrictOptions = [
  '黄浦区',
  '徐汇区',
  '长宁区',
  '静安区',
  '普陀区',
  '虹口区',
  '杨浦区',
  '闵行区',
  '宝山区',
  '嘉定区',
  '浦东新区',
  '金山区',
  '松江区',
  '青浦区',
  '奉贤区',
  '崇明区',
]

const projectTypeOptions = [
  '历史文化保护',
  '城市更新',
  '老旧社区改造',
  'TOD开发',
  '海绵城市',
  '儿童友好',
  '老龄友好',
  '无障碍',
  '应急避险',
  '生态修复',
  '滨水空间',
  '生物多样性',
  '低碳设计',
  '高密度开发',
  '地下空间开发',
]

const siteFeatureOptions = [
  '滨水',
  '山地',
  '湿地',
  '历史街区',
  '校园',
  '医院',
  '工业遗址',
  '交通枢纽',
  '生态敏感区',
  '风景名胜区',
]

const formulas = [
  {
    tag: '概况',
    title: '有效绿地率',
    formula: '绿地面积 ÷ 总用地面积 × 100%',
    requirement: '居住区 ≥ 30%；公园 ≥ 65%',
    source: 'GB 50180-2018 / GB 51192-2016',
  },
  { tag: '宏观', title: '人均公园绿地面积' },
  { tag: '概况', title: '建筑密度' },
  { tag: '宏观', title: '海绵城市径流控制率' },
]

const verifyRows = [
  ['绿地率', '27.5%', '≥ 30%', '未达标'],
  ['建筑密度', '18.3%', '≤ 30%', '达标'],
  ['硬质铺装率', '34.2%', '≤ 30%', '未达标'],
  ['活动场地占比', '10.0%', '8% ~ 15%', '达标'],
  ['水体面积占比', '10.0%', '—', '达标'],
]

const suggestions = [
  {
    title: '绿地率 27.5%',
    status: '未达标',
    body: '在西北角 1200m² 硬质广场上增设条形花坛与渗水砖，预计可提升至 32.4%。',
  },
  {
    title: '人均公园绿地 待补充',
    status: '数据缺失',
    body: '建议先在「指标导引」中填写规划人口，或上传社会调研数据后再核算。',
  },
  {
    title: '建筑密度 18.3%',
    status: '达标',
    body: '余量 11.7%，可考虑在东侧增设社区配套用房，仍处合规区间。',
  },
  {
    title: '硬质率 34.2%',
    status: '偏高',
    body: '建议将主园路两侧 5m 范围替换为透水铺装并增加乔木树荫，缓解热岛。',
  },
]

const SectionShell: FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-[20px] border border-[#dfe7dc] bg-white ${className}`}>
    {children}
  </div>
)

function stripThinkContent(content: string) {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

function parseJsonLikeContent(content: string): any {
  const cleaned = stripThinkContent(content)
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim()

  const candidates = [
    cleaned,
    cleaned.match(/\{[\s\S]*\}/)?.[0] || '',
    cleaned.match(/\[[\s\S]*\]/)?.[0] || '',
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    }
    catch {
      // Continue trying looser candidates.
    }
  }

  return null
}

function parseRecognizedColors(content: string): RecognizedColor[] {
  const parsed = parseJsonLikeContent(content)
  const rawColors = (() => {
    if (Array.isArray(parsed)) {
      return parsed
    }

    if (parsed?.json_data) {
      if (Array.isArray(parsed.json_data)) {
        return parsed.json_data
      }

      if (typeof parsed.json_data === 'string') {
        try {
          return JSON.parse(parsed.json_data)
        }
        catch {
          return []
        }
      }
    }

    return []
  })()

  if (!Array.isArray(rawColors)) {
    return []
  }

  return rawColors
    .map((item: any) => ({
      hex: typeof item.hex === 'string' ? item.hex : '',
      count: Number(item.count) || 0,
      percentage: Number(item.percentage) || 0,
    }))
    .filter(item => /^#[0-9a-f]{6}$/i.test(item.hex) && item.percentage > 0)
}

function parseRecommendedIndicators(content: string): RecommendedIndicator[] {
  const parsed = parseJsonLikeContent(content)
  const rawIndicators = Array.isArray(parsed) ? parsed : parsed?.indicators

  if (!Array.isArray(rawIndicators)) {
    return []
  }

  return rawIndicators
    .map((item: any) => ({
      name: String(item.name || item.indicator_name || item.title || '').trim(),
      value: String(item.value || item.requirement || item.standard_value || '').trim(),
      basis: String(item.basis || item.source || item.spec || item.reference || '').trim(),
      reason: String(item.reason || item.description || item.explanation || '').trim(),
    }))
    .filter(item => item.name && item.value)
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const MetricCalculator: FC<IMetricCalculatorProps> = ({ isMobile = false }) => {
  const [activePanel, setActivePanel] = useState<MetricPanel>('parcel')
  const [openFormulaIndex, setOpenFormulaIndex] = useState(0)
  const [parcelImage, setParcelImage] = useState<ImageFile | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognitionAnswer, setRecognitionAnswer] = useState('')
  const [recognizedColors, setRecognizedColors] = useState<RecognizedColor[]>([])
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false)
  const [guideAnswer, setGuideAnswer] = useState('')
  const [recommendedIndicators, setRecommendedIndicators] = useState<RecommendedIndicator[]>([])
  const [guideForm, setGuideForm] = useState({
    landUseType: landUseTypeOptions[0],
    district: shanghaiDistrictOptions[10],
    landArea: '',
    plannedPopulation: '',
    projectTypes: [] as string[],
    siteFeatures: [] as string[],
  })

  const activeTitle = tabs.find(item => item.key === activePanel)?.title || '地块识别'
  const hasUploadedParcelImage = !!parcelImage && !parcelImage.deleted
  const hasRecognitionAnswer = recognitionAnswer.trim().length > 0
  const hasRecognizedColors = recognizedColors.length > 0
  const hasGuideAnswer = guideAnswer.trim().length > 0
  const hasRecommendedIndicators = recommendedIndicators.length > 0
  const selectedProjectTypesText = guideForm.projectTypes.length ? guideForm.projectTypes.join(' / ') : '未选择'
  const selectedSiteFeaturesText = guideForm.siteFeatures.length ? guideForm.siteFeatures.join(' / ') : '未选择'

  const toggleGuideOption = (field: 'projectTypes' | 'siteFeatures', option: string) => {
    setGuideForm((current) => {
      const selected = current[field]
      return {
        ...current,
        [field]: selected.includes(option)
          ? selected.filter(item => item !== option)
          : [...selected, option],
      }
    })
  }

  const handleRemoveParcelImage = () => {
    setParcelImage(null)
    setRecognitionAnswer('')
    setRecognizedColors([])
    setIsRecognizing(false)
  }

  const handleRecognizeParcelImage = async () => {
    if (!parcelImage?.fileId) {
      Toast.notify({ type: 'error', message: '请先等待图片上传完成' })
      return
    }

    setIsRecognizing(true)
    setRecognitionAnswer('')
    setRecognizedColors([])

    const responseItem = { content: '' }
    let temporaryConversationId = ''

    const cleanupTemporaryConversation = async () => {
      if (!temporaryConversationId) {
        return
      }

      const conversationId = temporaryConversationId
      temporaryConversationId = ''
      try {
        await deleteConversation(conversationId)
      }
      catch {
        // If cleanup fails, keep the recognition result visible and avoid interrupting the user's flow.
      }
    }

    await sendChatMessage({
      inputs: {},
      query: '请识别这张城市绿地规划底图中的地块类型，并输出绿地、建筑、水体、道路、活动场地等识别结果及可用于经济技术指标表的关键数据。',
      conversation_id: null,
      files: [
        {
          type: 'image',
          transfer_method: TransferMethod.local_file,
          url: '',
          upload_file_id: parcelImage.fileId,
        },
      ],
    }, {
      onData: (nextMessage: string, _isFirstMessage, moreInfo) => {
        if (moreInfo?.conversationId) {
          temporaryConversationId = moreInfo.conversationId
        }
        responseItem.content += nextMessage
        setRecognitionAnswer(responseItem.content)
      },
      onCompleted: async () => {
        const nextColors = parseRecognizedColors(responseItem.content)
        setRecognizedColors(nextColors)
        if (nextColors.length === 0) {
          Toast.notify({ type: 'info', message: '已返回内容，但没有解析到地块数组' })
        }
        await cleanupTemporaryConversation()
        setIsRecognizing(false)
      },
      onError: async () => {
        await cleanupTemporaryConversation()
        setIsRecognizing(false)
      },
      onThought: () => {},
      onFile: () => {},
      onMessageEnd: () => {},
      onMessageReplace: () => {},
      onWorkflowStarted: () => {},
      onNodeStarted: () => {},
      onNodeFinished: () => {},
      onWorkflowFinished: () => {},
    })
  }

  const handleGenerateGuide = async () => {
    if (isGeneratingGuide) {
      return
    }

    setIsGeneratingGuide(true)
    setGuideAnswer('')
    setRecommendedIndicators([])

    const guidePayload = {
      task_type: 'indicator_guidance',
      project_background: {
        land_use_type: guideForm.landUseType,
        district: guideForm.district,
        land_area_m2: guideForm.landArea ? Number(guideForm.landArea) || guideForm.landArea : '',
        planned_population: guideForm.plannedPopulation ? Number(guideForm.plannedPopulation) || guideForm.plannedPopulation : '',
        project_types: guideForm.projectTypes,
        site_features: guideForm.siteFeatures,
      },
      output_schema: {
        indicators: [
          {
            name: '指标名称',
            value: '指标值或范围',
            basis: '规范名称/编号/条文',
            reason: '为什么该项目需要关注这个指标',
          },
        ],
      },
      output_requirements: [
        '只输出 JSON，不要 Markdown，不要解释文字。',
        'indicators 必须是数组。',
        '每个指标必须包含 name、value、basis、reason。',
      ],
    }

    const responseItem = { content: '' }
    let temporaryConversationId = ''

    const cleanupTemporaryConversation = async () => {
      if (!temporaryConversationId) {
        return
      }

      const conversationId = temporaryConversationId
      temporaryConversationId = ''
      try {
        await deleteConversation(conversationId)
      }
      catch {
        // Keep the generated result visible even if backend cleanup fails.
      }
    }

    await sendChatMessage({
      inputs: {},
      query: JSON.stringify(guidePayload, null, 2),
      conversation_id: null,
    }, {
      onData: (nextMessage: string, _isFirstMessage, moreInfo) => {
        if (moreInfo?.conversationId) {
          temporaryConversationId = moreInfo.conversationId
        }
        responseItem.content += nextMessage
        setGuideAnswer(responseItem.content)
      },
      onCompleted: async () => {
        const nextIndicators = parseRecommendedIndicators(responseItem.content)
        setRecommendedIndicators(nextIndicators)
        if (nextIndicators.length === 0) {
          Toast.notify({ type: 'info', message: '已返回内容，但没有解析到指标数组' })
        }
        await cleanupTemporaryConversation()
        setIsGeneratingGuide(false)
      },
      onError: async () => {
        await cleanupTemporaryConversation()
        setIsGeneratingGuide(false)
      },
      onThought: () => {},
      onFile: () => {},
      onMessageEnd: () => {},
      onMessageReplace: () => {},
      onWorkflowStarted: () => {},
      onNodeStarted: () => {},
      onNodeFinished: () => {},
      onWorkflowFinished: () => {},
    })
  }

  const handleExportMetrics = () => {
    if (!hasRecognizedColors) {
      Toast.notify({ type: 'info', message: '暂无可导出的指标数据' })
      return
    }

    const tableRows = recognizedColors.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="background:${escapeHtml(row.hex)};color:#06130c;">${escapeHtml(row.hex)}</td>
        <td>${row.count}</td>
        <td>${row.percentage.toFixed(1)}%</td>
      </tr>
    `).join('')

    const excelHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #dfe7dc; padding: 8px 12px; }
            th { background: #eef3ec; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>地块颜色</th>
                <th>像素数量</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'greenbot-地块识别指标表.xls'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    Toast.notify({ type: 'success', message: '已导出指标表' })
  }

  return (
    <div className='flex h-full min-h-0 flex-col bg-white text-[#06130c]'>
      <header className='shrink-0 border-b border-[#dfe7dc] bg-white'>
        <div className={`${isMobile ? 'px-4 pb-3 pt-4' : 'px-[30px] pb-1 pt-4'} shrink-0`}>
          <h1 className={`${isMobile ? 'text-[26px] leading-8' : 'text-[24px] leading-8'} font-semibold text-[#06130c]`}>指标计算</h1>
          <p className={`${isMobile ? 'mt-1 text-[14px]' : 'mt-1 text-[13px]'} leading-5 text-[#53605a]`}>规划指标全流程工作台</p>
        </div>
        <div className={`${isMobile ? 'overflow-x-auto px-4' : 'px-[30px]'} flex gap-3`}>
          {tabs.map((item) => {
            const Icon = item.icon
            const isActive = activePanel === item.key

            return (
              <button
                type='button'
                key={item.key}
                onClick={() => setActivePanel(item.key)}
                className={`flex min-w-[190px] items-center gap-3 rounded-t-[18px] py-1.5 pl-0 pr-4 text-left transition ${
                  isActive ? 'bg-white shadow-[0_-10px_24px_-22px_rgba(15,23,42,0.18)]' : 'hover:bg-white/70'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isActive ? 'bg-[#2f9e44] text-white' : 'bg-[#eef3ec] text-[#53605a]'
                }`}>
                  <Icon className='h-3.5 w-3.5' />
                </span>
                <span className='min-w-0'>
                  <span className='block text-[14px] font-semibold leading-5 text-[#06130c]'>{item.title}</span>
                  <span className='block truncate text-[10px] leading-4 text-[#53605a]'>{item.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </header>

      <main className={`${isMobile ? 'px-4 py-4' : 'px-[30px] py-6'} min-h-0 flex-1 overflow-y-auto bg-white`}>
        <div className='mb-3 text-[13px] text-[#53605a]'>
          指标计算 <span className='px-1'>/</span> <span className='font-medium text-[#06130c]'>{activeTitle}</span>
        </div>
        <h2 className='mb-5 text-[22px] font-semibold leading-7 text-[#06130c]'>{activeTitle}</h2>

        {activePanel === 'parcel' && (
          <div className='space-y-5'>
            <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_360px]'} grid gap-5`}>
              <div className='relative min-h-[390px] overflow-hidden rounded-[18px] border border-dashed border-[#cbd6c8] bg-[#f2f6f0]'>
                <div className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-4 transition ${
                  hasUploadedParcelImage ? 'opacity-0 hover:opacity-100' : ''
                }`}>
                  <Uploader onUpload={setParcelImage}>
                    {hovering => (
                      <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#2f9e44] shadow-[0_18px_38px_-24px_rgba(47,158,68,0.55)] ring-1 ring-[#dfeee0] transition ${
                        hovering ? 'scale-[1.03] ring-2 ring-[#2f9e44]/35' : ''
                      }`}>
                        <CloudUploadIcon className='h-11 w-11' />
                      </div>
                    )}
                  </Uploader>
                  {!hasUploadedParcelImage && (
                    <div className='text-center'>
                      <div className='text-[15px] font-semibold text-[#06130c]'>点击或拖拽上传规划底图</div>
                      <div className='mt-1 text-[12px] text-[#53605a]'>上传后自动识别绿地、建筑、水体、道路与活动场地</div>
                    </div>
                  )}
                </div>
                {hasUploadedParcelImage
                  ? (
                    <>
                      <img
                        src={parcelImage.base64Url || parcelImage.url}
                        alt='已上传规划底图'
                        className='absolute inset-0 h-full w-full object-contain p-6'
                      />
                      {parcelImage.progress !== 100 && (
                        <div className='absolute inset-0 flex flex-col items-center justify-center bg-white/72 backdrop-blur-[1px]'>
                          <div className='h-2 w-48 overflow-hidden rounded-full bg-[#dfe7dc]'>
                            <div className='h-full rounded-full bg-[#2f9e44]' style={{ width: `${Math.max(parcelImage.progress, 0)}%` }} />
                          </div>
                          <div className='mt-3 text-[13px] font-medium text-[#53605a]'>
                            {parcelImage.progress === -1 ? '上传失败，点击重新选择图片' : `正在上传 ${parcelImage.progress}%`}
                          </div>
                        </div>
                      )}
                      <div className='absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3'>
                        <button
                          type='button'
                          onClick={handleRemoveParcelImage}
                          className='h-10 rounded-full border border-[#dfe7dc] bg-white px-5 text-[13px] font-semibold text-[#53605a] shadow-[0_14px_30px_-24px_rgba(15,23,42,0.26)] transition hover:bg-[#f7faf6]'
                        >
                          取消
                        </button>
                        <button
                          type='button'
                          onClick={handleRecognizeParcelImage}
                          disabled={parcelImage.progress !== 100 || !parcelImage.fileId || isRecognizing}
                          className='h-10 rounded-full bg-[#2f9e44] px-6 text-[13px] font-semibold text-white shadow-[0_14px_30px_-24px_rgba(47,158,68,0.62)] transition hover:bg-[#288a3d] disabled:cursor-not-allowed disabled:bg-[#a9c9aa] disabled:shadow-none'
                        >
                          {isRecognizing ? '识别中' : '发送'}
                        </button>
                      </div>
                    </>
                  )
                  : (
                    null
                  )}
              </div>

              <SectionShell className='p-5'>
                <div className='mb-4 flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                    <ScanIcon className='h-4 w-4 text-[#2f9e44]' />
                    地块识别结果
                  </div>
                  <button type='button' className='text-[12px] font-medium text-[#2f9e44]'>重新识别</button>
                </div>
                {isRecognizing && (
                  <div className='flex min-h-[220px] items-center justify-center rounded-[16px] bg-[#f7faf6] px-6 text-center text-[13px] text-[#53605a]'>
                    等待识别结果...
                  </div>
                )}
                {!isRecognizing && hasRecognitionAnswer && !hasRecognizedColors && (
                  <div className='max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-[16px] bg-[#f7faf6] px-4 py-4 text-[13px] leading-6 text-[#06130c]'>
                    {recognitionAnswer}
                  </div>
                )}
                {!isRecognizing && !hasRecognitionAnswer && (
                  <div className='flex min-h-[220px] items-center justify-center rounded-[16px] bg-[#f7faf6] px-6 text-center'>
                    <div>
                      <div className='text-[14px] font-semibold text-[#06130c]'>等待识别结果</div>
                      <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>上传图片发送，返回识别结果。</div>
                    </div>
                  </div>
                )}
                {hasRecognizedColors && (
                  <div className='mt-5 space-y-3'>
                    <div className='rounded-[16px] bg-[#f7faf6] px-4 py-3 text-[13px] leading-6 text-[#06130c]'>
                      已解析出 <span className='font-semibold text-[#2f9e44]'>{recognizedColors.length}</span> 种有效地块。
                    </div>
                    {recognizedColors.map(item => (
                      <div key={item.hex}>
                        <div className='mb-1.5 flex items-center justify-between text-[12px]'>
                          <div className='flex items-center gap-2 font-medium text-[#06130c]'>
                            <span className='h-3 w-3 rounded-[3px]' style={{ backgroundColor: item.hex }} />
                            {item.hex}
                          </div>
                          <div className='font-semibold text-[#06130c]'>{item.percentage.toFixed(1)}%</div>
                        </div>
                        <div className='h-1.5 overflow-hidden rounded-full bg-[#edf2ea]'>
                          <div className='h-full rounded-full' style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.hex }} />
                        </div>
                        <div className='mt-0.5 text-right text-[11px] text-[#6f7d75]'>{item.count.toLocaleString()} px</div>
                      </div>
                    ))}
                    <div className='border-t border-[#e7eee4] pt-4'>
                      <div className='flex items-center justify-between text-[14px]'>
                        <span className='text-[#53605a]'>有效地块</span>
                        <span className='text-[16px] font-semibold text-[#06130c]'>{recognizedColors.length} 类</span>
                      </div>
                    </div>
                  </div>
                )}
              </SectionShell>
            </div>

            <SectionShell className='overflow-hidden'>
              <div className='flex items-center justify-between border-b border-[#dfe7dc] px-5 py-4'>
                <div className='flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                  <ClipboardDocumentCheckIcon className='h-4 w-4 text-[#2f9e44]' />
                  经济技术指标表
                  <span className='rounded-full bg-[#e2f5e5] px-2 py-0.5 text-[11px] font-medium text-[#2f9e44]'>已自动生成</span>
                </div>
                <button type='button' onClick={handleExportMetrics} disabled={!hasRecognizedColors} className='flex items-center gap-1.5 rounded-full bg-[#2f9e44] px-4 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#a9c9aa]'>
                  <ArrowDownTrayIcon className='h-4 w-4' />
                  导出 Excel
                </button>
              </div>
              {hasRecognizedColors
                ? (
                  <div className='overflow-x-auto'>
                    <table className='w-full min-w-[680px] text-left text-[13px]'>
                      <thead className='text-[#53605a]'>
                        <tr className='border-b border-[#e7eee4]'>
                          <th className='px-5 py-3 font-medium'>序号</th>
                          <th className='px-5 py-3 font-medium'>地块颜色</th>
                          <th className='px-5 py-3 text-right font-medium'>像素数量</th>
                          <th className='px-5 py-3 text-right font-medium'>占比</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recognizedColors.map((row, index) => (
                          <tr key={row.hex} className='border-b border-[#e7eee4] last:border-b-0'>
                            <td className='px-5 py-3 text-[#53605a]'>{index + 1}</td>
                            <td className='px-5 py-3 font-medium text-[#06130c]'>
                              <span className='inline-flex items-center gap-2'>
                                <span className='h-3 w-3 rounded-[3px]' style={{ backgroundColor: row.hex }} />
                                {row.hex}
                              </span>
                            </td>
                            <td className='px-5 py-3 text-right font-semibold text-[#06130c]'>{row.count.toLocaleString()}</td>
                            <td className='px-5 py-3 text-right font-semibold text-[#06130c]'>{row.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
                : (
                  <div className='flex min-h-[160px] items-center justify-center px-6 text-center'>
                    <div>
                      <div className='text-[14px] font-semibold text-[#06130c]'>暂无指标数据</div>
                      <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>请先上传规划底图并点击发送，识别完成后将生成经济技术指标表。</div>
                    </div>
                  </div>
                )}
            </SectionShell>
          </div>
        )}

        {activePanel === 'guide' && (
          <div className='space-y-6'>
            <SectionShell className='p-5'>
              <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                <CheckCircleIcon className='h-4 w-4 text-[#2f9e44]' />
                项目基础信息
              </div>
              <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-4'} grid gap-4`}>
                <label className='text-[12px] text-[#53605a]'>
                  用地性质
                  <select
                    value={guideForm.landUseType}
                    onChange={event => setGuideForm(current => ({ ...current, landUseType: event.target.value }))}
                    className='mt-1 h-10 w-full rounded-[12px] border-0 bg-[#eef3ec] px-3 text-[14px] font-medium text-[#06130c] outline-none'
                  >
                    {landUseTypeOptions.map(option => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className='text-[12px] text-[#53605a]'>
                  所在地区
                  <select
                    value={guideForm.district}
                    onChange={event => setGuideForm(current => ({ ...current, district: event.target.value }))}
                    className='mt-1 h-10 w-full rounded-[12px] border-0 bg-[#eef3ec] px-3 text-[14px] font-medium text-[#06130c] outline-none'
                  >
                    {shanghaiDistrictOptions.map(option => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className='text-[12px] text-[#53605a]'>
                  用地规模 (m²)
                  <input
                    value={guideForm.landArea}
                    onChange={event => setGuideForm(current => ({ ...current, landArea: event.target.value }))}
                    className='mt-1 h-10 w-full rounded-[12px] border-0 bg-[#eef3ec] px-3 text-[14px] outline-none placeholder:text-[#8b968c]'
                    placeholder='例如 12000'
                    inputMode='decimal'
                  />
                </label>
                <label className='text-[12px] text-[#53605a]'>
                  规划人口 (人)
                  <input
                    value={guideForm.plannedPopulation}
                    onChange={event => setGuideForm(current => ({ ...current, plannedPopulation: event.target.value }))}
                    className='mt-1 h-10 w-full rounded-[12px] border-0 bg-[#eef3ec] px-3 text-[14px] outline-none placeholder:text-[#8b968c]'
                    placeholder='例如 3500'
                    inputMode='numeric'
                  />
                </label>
              </div>
            </SectionShell>

            <SectionShell className='p-5'>
              <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                <SparklesIcon className='h-4 w-4 text-[#2f9e44]' />
                项目类型
                <span className='text-[12px] font-normal text-[#53605a]'>可多选</span>
              </div>
              <div className='flex flex-wrap gap-2.5'>
                {projectTypeOptions.map((option) => {
                  const selected = guideForm.projectTypes.includes(option)

                  return (
                    <button
                      key={option}
                      type='button'
                      onClick={() => toggleGuideOption('projectTypes', option)}
                      className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                        selected
                          ? 'border-[#2f9e44] bg-[#2f9e44] text-white shadow-[0_10px_22px_-18px_rgba(47,158,68,0.75)]'
                          : 'border-[#dfe7dc] bg-white text-[#53605a] hover:border-[#b8d9b8] hover:bg-[#f7faf6] hover:text-[#2f9e44]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </SectionShell>

            <SectionShell className='p-5'>
              <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                <SparklesIcon className='h-4 w-4 text-[#2f9e44]' />
                场地特征
                <span className='text-[12px] font-normal text-[#53605a]'>可多选</span>
              </div>
              <div className='flex flex-wrap gap-2.5'>
                {siteFeatureOptions.map((option) => {
                  const selected = guideForm.siteFeatures.includes(option)

                  return (
                    <button
                      key={option}
                      type='button'
                      onClick={() => toggleGuideOption('siteFeatures', option)}
                      className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                        selected
                          ? 'border-[#2f9e44] bg-[#2f9e44] text-white shadow-[0_10px_22px_-18px_rgba(47,158,68,0.75)]'
                          : 'border-[#dfe7dc] bg-white text-[#53605a] hover:border-[#b8d9b8] hover:bg-[#f7faf6] hover:text-[#2f9e44]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </SectionShell>

            <SectionShell className='p-5'>
              <div className={`${isMobile ? 'items-start gap-4' : 'items-center justify-between gap-6'} flex flex-col sm:flex-row`}>
                <div>
                  <div className='mb-3 text-[15px] font-semibold text-[#06130c]'>项目画像</div>
                  <div className='space-y-2 text-[13px] leading-6 text-[#53605a]'>
                    <div>
                      <span className='font-semibold text-[#06130c]'>{guideForm.district}</span>
                      <span className='px-2 text-[#b7c2b5]'>/</span>
                      <span className='font-semibold text-[#06130c]'>{guideForm.landUseType}</span>
                      {guideForm.landArea && <span className='px-2 text-[#53605a]'>· {guideForm.landArea}m²</span>}
                      {guideForm.plannedPopulation && <span className='text-[#53605a]'>· {guideForm.plannedPopulation}人</span>}
                    </div>
                    <div>项目类型：{selectedProjectTypesText}</div>
                    <div>场地特征：{selectedSiteFeaturesText}</div>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={handleGenerateGuide}
                  disabled={isGeneratingGuide}
                  className='shrink-0 rounded-full bg-[#2f9e44] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_30px_-22px_rgba(47,158,68,0.68)] transition hover:bg-[#288a3d] disabled:cursor-not-allowed disabled:bg-[#a9c9aa] disabled:shadow-none'
                >
                  {isGeneratingGuide ? '生成中...' : hasGuideAnswer ? '重新生成指标导引' : '生成指标导引'}
                </button>
              </div>
            </SectionShell>

            <div>
              <div className='mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                <SparklesIcon className='h-4 w-4 text-[#2f9e44]' />
                推荐指标
                <span className='text-[12px] font-normal text-[#53605a]'>基于 {guideForm.landUseType}</span>
              </div>
              {isGeneratingGuide && (
                <SectionShell className='flex min-h-[150px] items-center justify-center px-6 text-center'>
                  <div>
                    <div className='text-[14px] font-semibold text-[#06130c]'>等待推荐结果...</div>
                    <div className='mt-2 text-[12px] text-[#53605a]'>正在根据项目画像检索并生成指标导引。</div>
                  </div>
                </SectionShell>
              )}
              {!isGeneratingGuide && !hasGuideAnswer && (
                <SectionShell className='flex min-h-[150px] items-center justify-center px-6 text-center'>
                  <div>
                    <div className='text-[14px] font-semibold text-[#06130c]'>暂无推荐指标</div>
                    <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>请先填写项目信息，选择项目类型与场地特征，然后点击生成指标导引。</div>
                  </div>
                </SectionShell>
              )}
              {!isGeneratingGuide && hasGuideAnswer && !hasRecommendedIndicators && (
                <SectionShell className='max-h-[260px] overflow-y-auto whitespace-pre-wrap px-5 py-4 text-[13px] leading-6 text-[#06130c]'>
                  {guideAnswer}
                </SectionShell>
              )}
              {hasRecommendedIndicators && (
                <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-2'} grid gap-4`}>
                  {recommendedIndicators.map(item => (
                    <SectionShell key={`${item.name}-${item.value}`} className='flex items-start justify-between gap-4 p-5'>
                      <div className='min-w-0'>
                        <div className='text-[15px] font-semibold text-[#06130c]'>{item.name}</div>
                        <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.basis || '待补充规范依据'}</div>
                        {item.reason && <div className='mt-2 text-[12px] leading-5 text-[#6f7d75]'>{item.reason}</div>}
                      </div>
                      <span className='shrink-0 rounded-full bg-[#def3df] px-2.5 py-1 text-[11px] font-semibold text-[#2f9e44]'>{item.value}</span>
                    </SectionShell>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'formula' && (
          <div className='space-y-4'>
            <div className='flex h-[50px] items-center rounded-full bg-[#eef3ec] px-5'>
              <CalculatorIcon className='h-5 w-5 text-[#607069]' />
              <input className='ml-3 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-[#8b968c]' placeholder='搜索公式 / 类别' />
            </div>

            {formulas.map((item, index) => {
              const isOpen = openFormulaIndex === index

              return (
                <SectionShell key={item.title} className='overflow-hidden'>
                  <button
                    type='button'
                    onClick={() => setOpenFormulaIndex(isOpen ? -1 : index)}
                    className='flex w-full items-center justify-between px-5 py-4 text-left'
                  >
                    <span className='flex items-center gap-3'>
                      <span className='rounded-[6px] bg-[#edf5ec] px-2 py-1 text-[12px] font-medium text-[#5f745f]'>{item.tag}</span>
                      <span className='text-[16px] font-semibold text-[#06130c]'>{item.title}</span>
                    </span>
                    {isOpen ? <ChevronUpIcon className='h-4 w-4 text-[#53605a]' /> : <ChevronDownIcon className='h-4 w-4 text-[#53605a]' />}
                  </button>
                  {isOpen && 'formula' in item && (
                    <div className='border-t border-[#dfe7dc] px-5 py-5'>
                      <div className='rounded-[16px] border border-[#dfe7dc] px-5 py-4 text-[16px] font-semibold text-[#06130c]'>{item.formula}</div>
                      <div className={`${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2'} mt-4 grid text-[13px] text-[#53605a]`}>
                        <div>规范要求：<span className='text-[#06130c]'>{item.requirement}</span></div>
                        <div>出处：<span className='text-[#06130c]'>{item.source}</span></div>
                      </div>
                      <div className='mt-5 rounded-[18px] border border-[#dfe7dc] p-5'>
                        <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                          <CalculatorIcon className='h-4 w-4 text-[#2f9e44]' />
                          内嵌计算器
                        </div>
                        <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-2'} grid gap-4`}>
                          <input className='h-10 rounded-full border-0 bg-[#eef3ec] px-4 text-[14px] outline-none placeholder:text-[#8b968c]' placeholder='绿地面积 (m²)  输入数值' />
                          <input className='h-10 rounded-full border-0 bg-[#eef3ec] px-4 text-[14px] outline-none placeholder:text-[#8b968c]' placeholder='总用地面积 (m²)  输入数值' />
                        </div>
                        <div className='mt-4 text-[15px] text-[#53605a]'>= 计算结果：<span className='font-semibold text-[#2f9e44]'>请补全变量</span></div>
                      </div>
                    </div>
                  )}
                </SectionShell>
              )
            })}
          </div>
        )}

        {activePanel === 'verify' && (
          <div className='space-y-5'>
            <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-[280px_1fr]'} grid gap-5`}>
              <SectionShell className='flex min-h-[210px] flex-col items-center justify-center p-5'>
                <div className='relative flex h-[128px] w-[128px] items-center justify-center rounded-full border-[10px] border-[#edf2ea]'>
                  <div className='absolute inset-[-10px] rounded-full border-[10px] border-[#e8c75e] border-l-transparent border-b-transparent' />
                  <div className='relative text-center'>
                    <div className='text-[30px] font-semibold text-[#e2bb4b]'>60</div>
                    <div className='text-[12px] text-[#53605a]'>合规得分</div>
                  </div>
                </div>
                <div className='mt-4 text-[14px] text-[#53605a]'>3 / 5 项达标</div>
              </SectionShell>

              <SectionShell className='p-6'>
                <div className='mb-4 flex items-center justify-between gap-4'>
                  <div className='flex items-center gap-2 text-[16px] font-semibold text-[#06130c]'>
                    <ShieldCheckIcon className='h-5 w-5 text-[#2f9e44]' />
                    核验摘要
                  </div>
                  <button type='button' className='rounded-full bg-[#2f9e44] px-4 py-2 text-[12px] font-semibold text-white'>生成核验报告</button>
                </div>
                <div className='space-y-3 text-[14px] leading-6 text-[#06130c]'>
                  <p>• 绿地率 <span className='font-semibold text-red-500'>未达 GB 50180 要求</span>，缺口 2.5 个百分点。</p>
                  <p>• 硬质铺装率偏高，建议替换为透水铺装以降低径流系数。</p>
                  <p>• 建筑密度与活动场地占比均处于合规区间，可作为方案亮点。</p>
                  <p>• 报告将包含：指标表、规范对照、不达标说明、优化建议、签字页。</p>
                </div>
              </SectionShell>
            </div>

            <SectionShell className='overflow-hidden'>
              <div className='border-b border-[#dfe7dc] px-5 py-4 text-[15px] font-semibold text-[#06130c]'>核算看板</div>
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[780px] text-left text-[13px]'>
                  <thead className='text-[#53605a]'>
                    <tr className='border-b border-[#e7eee4]'>
                      <th className='px-5 py-3 font-medium'>指标</th>
                      <th className='px-5 py-3 text-center font-medium'>实测值</th>
                      <th className='px-5 py-3 text-center font-medium'>规范要求</th>
                      <th className='px-5 py-3 text-right font-medium'>结论</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifyRows.map((row) => {
                      const failed = row[3] === '未达标'

                      return (
                        <tr key={row[0]} className='border-b border-[#e7eee4] last:border-b-0'>
                          <td className='px-5 py-4 font-medium text-[#06130c]'>{row[0]}</td>
                          <td className='px-5 py-4 text-center text-[15px] font-semibold text-[#06130c]'>{row[1]}</td>
                          <td className='px-5 py-4 text-center text-[#53605a]'>{row[2]}</td>
                          <td className={`px-5 py-4 text-right font-semibold ${failed ? 'text-red-500' : 'text-[#2f9e44]'}`}>
                            {failed ? <ExclamationTriangleIcon className='mr-1 inline h-4 w-4' /> : <CheckCircleIcon className='mr-1 inline h-4 w-4' />}
                            {row[3]}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </SectionShell>

            <div>
              <div className='mb-3 flex items-center gap-2 text-[16px] font-semibold text-[#06130c]'>
                <SparklesIcon className='h-5 w-5 text-[#2f9e44]' />
                优化建议
                <span className='text-[12px] font-normal text-[#53605a]'>基于现状自动生成</span>
              </div>
              <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-2'} grid gap-4`}>
                {suggestions.map(item => (
                  <SectionShell key={item.title} className='p-5'>
                    <div className='mb-2 flex items-center justify-between gap-3'>
                      <div className='text-[15px] font-semibold text-[#06130c]'>{item.title}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.status === '未达标' ? 'bg-red-50 text-red-500' : item.status === '偏高' ? 'bg-pink-50 text-pink-500' : 'bg-[#def3df] text-[#2f9e44]'
                      }`}>{item.status}</span>
                    </div>
                    <p className='text-[13px] leading-6 text-[#53605a]'>{item.body}</p>
                    <div className='mt-4 flex gap-2'>
                      <button type='button' className='rounded-full bg-[#2f9e44] px-4 py-2 text-[12px] font-semibold text-white'>+ 采纳建议</button>
                      <button type='button' className='rounded-full bg-[#edf3eb] px-4 py-2 text-[12px] font-semibold text-[#06130c]'>忽略</button>
                    </div>
                  </SectionShell>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default React.memo(MetricCalculator)
