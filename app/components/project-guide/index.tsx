'use client'

import type { FC } from 'react'
import React, { useState } from 'react'
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Toast from '@/app/components/base/toast'
import { deleteConversation, sendChatMessage } from '@/service'

interface IProjectGuideProps {
  isMobile?: boolean
}

interface RecommendedIndicator {
  name: string
  value: string
  basis: string
  source: string
  clause: string
  reason: string
}

interface RecommendedSpec {
  name: string
  code: string
  type: string
  reason: string
  relatedIndicators: string[]
  keywords: string[]
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
  '海绵城市',
  '全龄友好',
  '应急避险',
  '生态修复',
  '生物多样性',
  '低碳设计',
  '高密度开发',
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
  '风景名胜区',
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

function toTextList(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(/[、,，/]/).map(item => item.trim()).filter(Boolean)
  }

  return []
}

function getSpecTypeLabel(spec: RecommendedSpec) {
  if (spec.type) {
    return spec.type
  }

  const content = `${spec.code} ${spec.name}`.toUpperCase()

  if (/\bGB\/?T?\b/.test(content) || content.includes('国家标准')) {
    return '国标'
  }

  if (/\b(CJJ|CJ\/T|JGJ|LY\/T|TD\/T|HJ)\b/.test(content) || content.includes('行业标准')) {
    return '行标'
  }

  return '地标'
}

function parseGuidanceResult(content: string): { indicators: RecommendedIndicator[], specs: RecommendedSpec[] } {
  const parsed = parseJsonLikeContent(content)
  const rawIndicators = Array.isArray(parsed) ? parsed : parsed?.indicators || parsed?.recommended_indicators
  const rawSpecs = parsed?.specs || parsed?.standards || parsed?.recommended_specs || parsed?.norms

  const indicators = Array.isArray(rawIndicators)
    ? rawIndicators
      .map((item: any) => ({
        name: String(item.name || item.indicator_name || item.title || '').trim(),
        value: String(item.value || item.requirement || item.standard_value || '').trim(),
        basis: String(item.basis || item.spec || item.reference || item.source || '').trim(),
        source: String(item.source || item.standard_source || item.full_source || '').trim(),
        clause: String(item.clause || item.article || item.section || item.chapter || '').trim(),
        reason: String(item.reason || item.description || item.explanation || '').trim(),
      }))
      .filter((item: RecommendedIndicator) => item.name && item.value)
    : []

  const specs = Array.isArray(rawSpecs)
    ? rawSpecs
      .map((item: any) => ({
        name: String(item.name || item.spec_name || item.standard_name || item.title || '').trim(),
        code: String(item.code || item.number || item.standard_code || '').trim(),
        type: String(item.type || item.spec_type || item.standard_type || '').trim(),
        reason: String(item.reason || item.applicability || item.description || item.explanation || '').trim(),
        relatedIndicators: toTextList(item.relatedIndicators || item.related_indicators || item.indicators),
        keywords: toTextList(item.keywords || item.chapters || item.clauses || item.focus),
      }))
      .filter((item: RecommendedSpec) => item.name)
    : []

  const derivedSpecs = indicators
    .map(item => item.basis)
    .filter(Boolean)
    .filter((basis, index, list) => list.indexOf(basis) === index)
    .map(basis => ({
      name: basis,
      code: '',
      type: '',
      reason: '由推荐指标的规范依据提取，建议进一步查看相关条文。',
      relatedIndicators: indicators.filter(item => item.basis === basis).map(item => item.name),
      keywords: [],
    }))

  return {
    indicators,
    specs: specs.length ? specs : derivedSpecs,
  }
}

const ProjectGuide: FC<IProjectGuideProps> = ({ isMobile = false }) => {
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false)
  const [guideAnswer, setGuideAnswer] = useState('')
  const [recommendedIndicators, setRecommendedIndicators] = useState<RecommendedIndicator[]>([])
  const [recommendedSpecs, setRecommendedSpecs] = useState<RecommendedSpec[]>([])
  const [activeResultTab, setActiveResultTab] = useState<'indicators' | 'specs'>('indicators')
  const [guideForm, setGuideForm] = useState({
    landUseType: landUseTypeOptions[0],
    district: shanghaiDistrictOptions[10],
    landArea: '',
    plannedPopulation: '',
    projectTypes: [] as string[],
    siteFeatures: [] as string[],
    supplementalInfo: '',
  })

  const hasGuideAnswer = guideAnswer.trim().length > 0
  const hasRecommendedIndicators = recommendedIndicators.length > 0
  const hasRecommendedSpecs = recommendedSpecs.length > 0
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

  const handleGenerateGuide = async () => {
    if (isGeneratingGuide) {
      return
    }

    setIsGeneratingGuide(true)
    setGuideAnswer('')
    setRecommendedIndicators([])
    setRecommendedSpecs([])

    const guidePayload = {
      task_type: 'indicator_guidance',
      project_background: {
        land_use_type: guideForm.landUseType,
        district: guideForm.district,
        land_area_m2: guideForm.landArea ? Number(guideForm.landArea) || guideForm.landArea : '',
        planned_population: guideForm.plannedPopulation ? Number(guideForm.plannedPopulation) || guideForm.plannedPopulation : '',
        project_types: guideForm.projectTypes,
        site_features: guideForm.siteFeatures,
        supplemental_info: guideForm.supplementalInfo,
      },
      output_schema: {
        indicators: [
          {
            name: '指标名称',
            value: '指标值或范围',
            basis: '规范名称/编号/条文',
            source: '规范完整名称和编号',
            clause: '条文号、章节名或关键词',
            reason: '为什么该项目需要关注这个指标',
          },
        ],
        specs: [
          {
            name: '规范名称',
            code: '规范编号，可为空',
            type: '规范类型：国标、行标或地标',
            reason: '为什么该项目需要查看这个规范',
            relatedIndicators: ['关联指标名称'],
            keywords: ['建议查看的章节或关键词'],
          },
        ],
      },
      output_requirements: [
        '只输出 JSON，不要 Markdown，不要解释文字。',
        'indicators 必须是数组。',
        'specs 必须是数组。',
        '每个指标必须包含 name、value、basis、source、clause、reason。',
        '每个规范建议必须包含 name、type、reason，可补充 code、relatedIndicators、keywords。',
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
        const nextResult = parseGuidanceResult(responseItem.content)
        setRecommendedIndicators(nextResult.indicators)
        setRecommendedSpecs(nextResult.specs)
        if (nextResult.indicators.length === 0 && nextResult.specs.length === 0) {
          Toast.notify({ type: 'info', message: '已返回内容，但没有解析到导引结果' })
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

  return (
    <div className='flex h-full min-h-0 flex-col bg-white text-[#06130c]'>
      <header className='shrink-0 bg-white'>
        <div className={`${isMobile ? 'px-4 pb-3 pt-4' : 'px-[30px] pb-3 pt-4'} shrink-0`}>
          <h1 className={`${isMobile ? 'text-[26px] leading-8' : 'text-[24px] leading-8'} font-semibold text-[#06130c]`}>项目导引</h1>
          <p className={`${isMobile ? 'mt-1 text-[14px]' : 'mt-1 text-[13px]'} leading-5 text-[#53605a]`}>输入项目画像 · 告知要重点关注的规划指标</p>
        </div>
      </header>

      <main className={`${isMobile ? 'px-4 py-4' : 'px-[30px] py-6'} min-h-0 flex-1 overflow-y-auto bg-white`}>
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

          <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] items-stretch'} grid gap-5`}>
            <div className={isMobile ? 'space-y-5' : 'grid h-full grid-rows-2 gap-5'}>
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
            </div>

            <SectionShell className='flex min-h-full flex-col p-5'>
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

              <label className='mt-5 block text-[12px] font-medium text-[#53605a]'>
                补充信息
                <textarea
                  value={guideForm.supplementalInfo}
                  onChange={event => setGuideForm(current => ({ ...current, supplementalInfo: event.target.value }))}
                  className='mt-2 min-h-[120px] w-full resize-none rounded-[14px] border border-[#dfe7dc] bg-[#fbfdfb] px-3 py-3 text-[13px] leading-6 text-[#06130c] outline-none placeholder:text-[#9aa69d]'
                  placeholder='例如：基地周边有小学和养老设施，希望重点关注全龄友好、慢行安全等要求。'
                />
              </label>

              <div className='mt-auto flex justify-end pt-5'>
                <button
                  type='button'
                  onClick={handleGenerateGuide}
                  disabled={isGeneratingGuide}
                  className='shrink-0 rounded-full bg-[#2f9e44] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_30px_-22px_rgba(47,158,68,0.68)] transition hover:bg-[#288a3d] disabled:cursor-not-allowed disabled:bg-[#a9c9aa] disabled:shadow-none'
                >
                  {isGeneratingGuide ? '生成中...' : hasGuideAnswer ? '重新生成项目导引' : '生成项目导引'}
                </button>
              </div>
            </SectionShell>
          </div>

          <div>
            <div className='mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
              <SparklesIcon className='h-4 w-4 text-[#2f9e44]' />
              导引结果
              <span className='text-[12px] font-normal text-[#53605a]'>基于 {guideForm.landUseType}</span>
            </div>
            {isGeneratingGuide && (
              <SectionShell className='flex min-h-[170px] items-center justify-center px-6 text-center'>
                <div>
                  <div className='text-[14px] font-semibold text-[#06130c]'>正在生成导引结果...</div>
                  <div className='mt-2 text-[12px] text-[#53605a]'>正在根据项目画像推荐关注指标与应查看的规范。</div>
                </div>
              </SectionShell>
            )}
            {!isGeneratingGuide && !hasGuideAnswer && (
              <SectionShell className='flex min-h-[170px] items-center justify-center px-6 text-center'>
                <div>
                  <div className='text-[14px] font-semibold text-[#06130c]'>暂无导引结果</div>
                  <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>请先填写项目信息，选择项目类型与场地特征，然后点击生成项目导引。</div>
                </div>
              </SectionShell>
            )}
            {!isGeneratingGuide && hasGuideAnswer && !hasRecommendedIndicators && !hasRecommendedSpecs && (
              <SectionShell className='max-h-[260px] overflow-y-auto whitespace-pre-wrap px-5 py-4 text-[13px] leading-6 text-[#06130c]'>
                {guideAnswer}
              </SectionShell>
            )}
            {(hasRecommendedIndicators || hasRecommendedSpecs) && (
              <div>
                <div className='grid grid-cols-2 border-b border-[#e6ede3]'>
                  <button
                    type='button'
                    onClick={() => setActiveResultTab('indicators')}
                    className={`-mb-px border-b-[3px] px-4 py-4 text-center text-[15px] font-semibold transition ${
                      activeResultTab === 'indicators'
                        ? 'border-[#2f9e44] text-[#06130c]'
                        : 'border-transparent text-[#6f7d75] hover:text-[#06130c]'
                    }`}
                  >
                    推荐关注指标
                    <span className='ml-2 rounded-full bg-[#eef7ed] px-2 py-0.5 text-[11px] text-[#2f9e44]'>{recommendedIndicators.length} 项</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setActiveResultTab('specs')}
                    className={`-mb-px border-b-[3px] px-4 py-4 text-center text-[15px] font-semibold transition ${
                      activeResultTab === 'specs'
                        ? 'border-[#2f9e44] text-[#06130c]'
                        : 'border-transparent text-[#6f7d75] hover:text-[#06130c]'
                    }`}
                  >
                    推荐查看规范
                    <span className='ml-2 rounded-full bg-[#eef7ed] px-2 py-0.5 text-[11px] text-[#2f9e44]'>{recommendedSpecs.length} 部</span>
                  </button>
                </div>

                <div className='pt-5'>
                  {activeResultTab === 'indicators' && (
                    hasRecommendedIndicators
                      ? (
                        <div className='space-y-3'>
                          {recommendedIndicators.map(item => (
                            <div key={`${item.name}-${item.value}`} className='rounded-[14px] border border-[#e5ece2] bg-[#fbfdfb] p-4'>
                              <div className='flex items-start justify-between gap-4'>
                                <div className='min-w-0'>
                                  <div className='text-[15px] font-semibold text-[#06130c]'>{item.name}</div>
                                  <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.basis || '待补充规范依据'}</div>
                                </div>
                                <span className='shrink-0 rounded-full bg-[#def3df] px-2.5 py-1 text-[11px] font-semibold text-[#2f9e44]'>{item.value}</span>
                              </div>
                              {(item.source || item.clause) && (
                                <div className='mt-3 rounded-[12px] bg-white px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>
                                  <span className='font-semibold text-[#06130c]'>出处：</span>
                                  {item.source || item.basis}
                                  {item.clause && <span>，{item.clause}</span>}
                                </div>
                              )}
                              {item.reason && <div className='mt-3 text-[12px] leading-5 text-[#6f7d75]'>{item.reason}</div>}
                            </div>
                          ))}
                        </div>
                      )
                      : (
                        <div className='rounded-[14px] border border-dashed border-[#dfe7dc] px-4 py-8 text-center text-[12px] text-[#53605a]'>暂无指标推荐</div>
                      )
                  )}

                  {activeResultTab === 'specs' && (
                    hasRecommendedSpecs
                      ? (
                        <div className='space-y-3'>
                          {recommendedSpecs.map(item => (
                            <div key={`${item.name}-${item.code}`} className='rounded-[14px] border border-[#e5ece2] bg-white p-4'>
                              <div className='flex items-start justify-between gap-3'>
                                <div className='min-w-0'>
                                  <div className='text-[14px] font-semibold leading-5 text-[#06130c]'>{item.name}</div>
                                  {item.code && <div className='mt-1 text-[11px] font-medium text-[#2f9e44]'>{item.code}</div>}
                                </div>
                                <span className='shrink-0 rounded-full bg-[#f2f7f1] px-2.5 py-1 text-[11px] font-semibold text-[#53605a]'>{getSpecTypeLabel(item)}</span>
                              </div>
                              {item.reason && <div className='mt-3 text-[12px] leading-5 text-[#6f7d75]'>{item.reason}</div>}
                              {item.relatedIndicators.length > 0 && (
                                <div className='mt-3 flex flex-wrap gap-1.5'>
                                  {item.relatedIndicators.map(indicator => (
                                    <span key={indicator} className='rounded-full bg-[#eef3ec] px-2 py-1 text-[11px] text-[#53605a]'>{indicator}</span>
                                  ))}
                                </div>
                              )}
                              {item.keywords.length > 0 && (
                                <div className='mt-3 text-[11px] leading-5 text-[#7a877f]'>
                                  建议关注：{item.keywords.join(' / ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                      : (
                        <div className='rounded-[14px] border border-dashed border-[#dfe7dc] px-4 py-8 text-center text-[12px] text-[#53605a]'>暂无规范推荐</div>
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default React.memo(ProjectGuide)
