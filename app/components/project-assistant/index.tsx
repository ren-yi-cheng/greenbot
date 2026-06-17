'use client'

import type { FC } from 'react'
import React, { useState } from 'react'
import { BookOpenIcon, CheckCircleIcon, ChevronDownIcon, ClipboardDocumentCheckIcon, ClockIcon, FolderIcon, LightBulbIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Toast from '@/app/components/base/toast'
import { deleteConversation, sendChatMessage } from '@/service'
import courseCases from './course-cases.json'

interface IProjectAssistantProps {
  isMobile?: boolean
}

interface CourseCase {
  id: string
  caseName: string
  projectType: string
  siteConditions: string
  designTasks: string
  strategies: string[]
  relatedCodes: string[]
  usableMethods: string[]
  commonMistakes: string[]
  description: string
  link?: string
  location?: string
  company?: string
  area?: string
  caseKeywords?: string[]
}

type CaseContent = unknown

interface AssistantResult {
  overall_judgement?: string
  project_judgement?: string
  regulatory_framework?: string
  project_progress_plan?: string
  case_keywords?: string[]
  user_keywords?: string[]
  borrow_methods?: Array<{
    case_name?: string
    method?: string
    how_to_apply?: string
    source_keywords?: string[]
  }>
  case_introductions?: Array<{
    case_name?: string
    project_type?: string
    introduction?: string
    matched_keywords?: string[]
    related_spec_names?: string[]
    why_relevant?: string
  }>
  case_normative_links?: Array<{
    case_text_info?: string
    green_space_focus?: string
    possible_spec_direction?: string
  }>
  case_suggestions?: Array<{
    case_title?: string
    title?: string
    case_link?: string
    link?: string
    location?: string
    project_location?: string
    company?: string
    design_company?: string
    project_type?: string
    type?: string
    area?: string
    summary?: string
    self_summary?: string
    site_problem?: string
    site_problems?: string
    design_strategy?: string
    design_strategies?: string
    content?: CaseContent
    specs?: CaseSpec[]
    relevance?: string
    methods?: string[]
    regulation_focus?: string[]
    project_suggestions?: string[]
  }>
  cases_analysis?: Array<{
    case_title?: string
    case_link?: string
    location?: string
    project_location?: string
    company?: string
    design_company?: string
    project_type?: string
    type?: string
    area?: string
    search_queries?: string
    relevance?: string
    specs?: CaseSpec[]
    content?: CaseContent
    methods?: string[]
    project_suggestions?: string[]
  }>
  case_name?: string
  search_queries?: string
  specs?: CaseSpec[]
  cases?: Array<{
    name?: string
    case_name?: string
    case_title?: string
    title?: string
    case_link?: string
    link?: string
    content?: CaseContent
    relevance?: string
    methods?: string[]
    project_suggestions?: string[]
    source?: string
    reason?: string
    specs?: CaseSpec[]
  }>
  spec_cases?: Array<{
    case_name?: string
    search_queries?: string
    specs?: CaseSpec[]
  }>
  related_norm_names?: string[]
  usage_notes?: string[]
  matched_cases?: Array<{
    case_name?: string
    relevance?: string
    transferable_methods?: string[]
    normative_basis?: Array<{
      spec_name?: string
      check_focus?: string
      how_it_constrains_case?: string
    }>
    caution?: string
  }>
  design_actions?: string[]
  progress_suggestions?: Array<{
    priority?: string
    project_stage?: string
    suggestion?: string
    case_reference?: string
    normative_check?: string
    expected_output?: string
  }>
  regulatory_checks?: Array<{
    spec_name?: string
    check_item?: string
    why_it_matters?: string
  }>
  code_risks?: string[]
  deliverable_checklist?: string[]
  teacher_review_questions?: string[]
  next_steps?: string[]
}

interface CaseSpec {
  name?: string
  code?: string
  reason?: string
  relatedIndicators?: string[]
  keywords?: string[]
  source?: string
  clause?: string
}

interface CasePanelItem {
  title: string
  link?: string
  location?: string
  company?: string
  projectType?: string
  area?: string
  summary?: string
  siteProblem?: string
  designStrategy?: string
  contentSections: Array<{
    title: string
    text: string
  }>
  relevance?: string
  methods: string[]
  suggestions: string[]
  specs: CaseSpec[]
  keywords: string[]
}

const typedCourseCases = courseCases as CourseCase[]

const normativeSpecs = [
  {
    name: '城市绿地规划标准',
    code: 'GB/T 51346-2019',
    category: '国家标准',
    focus: ['绿地系统', '绿地分类', '服务半径', '人均绿地', '规划指标'],
    useFor: '判断项目在城市绿地系统中的类型、服务对象、规模关系和指标边界。',
  },
  {
    name: '公园设计规范',
    code: 'GB 51192-2016',
    category: '国家标准',
    focus: ['公园绿地', '游憩设施', '活动场地', '园路', '安全'],
    useFor: '核查公园类项目的功能分区、游憩活动、园路组织、服务设施和安全要求。',
  },
  {
    name: '城市绿地设计规范',
    code: 'GB 50420-2007（2016年版）',
    category: '国家标准',
    focus: ['绿地设计', '植物配置', '竖向', '水体', '铺装'],
    useFor: '核查绿地空间设计、植物配置、地形水体和工程做法是否具有落地依据。',
  },
  {
    name: '园林绿化工程项目规范',
    code: 'GB 55014-2021',
    category: '国家标准',
    focus: ['工程安全', '绿化工程', '植物种植', '养护', '强制性要求'],
    useFor: '提醒用户关注园林绿化工程层面的强制性底线，避免只停留在概念设计。',
  },
  {
    name: '城市居住区规划设计标准',
    code: 'GB 50180-2018',
    category: '国家标准',
    focus: ['社区公园', '居住区绿地', '服务半径', '公共服务', '儿童老人'],
    useFor: '用于社区绿地、居住区周边绿地和公共服务设施配置的指标判断。',
  },
  {
    name: '无障碍设计规范',
    code: 'GB 50763-2012',
    category: '国家标准',
    focus: ['无障碍', '全龄友好', '坡道', '通行宽度', '安全'],
    useFor: '核查老人、儿童、轮椅使用者等人群的连续通行和设施可达性。',
  },
  {
    name: '居住绿地设计标准',
    code: 'CJJ/T 294-2019',
    category: '行业标准',
    focus: ['居住绿地', '社区活动', '儿童活动', '老人活动', '植物配置'],
    useFor: '辅助判断社区公园、口袋公园和居住区绿地的活动空间与植物配置。',
  },
  {
    name: '城镇绿道工程技术标准',
    code: 'CJJ/T 304-2019',
    category: '行业标准',
    focus: ['绿道', '慢行', '滨水', '连续性', '节点'],
    useFor: '用于滨水绿廊、慢行系统和线性绿地的连续性与节点组织判断。',
  },
  {
    name: '城市道路绿化设计标准',
    code: 'CJJ/T 75-2023',
    category: '行业标准',
    focus: ['道路绿化', '街道空间', '行道树', '安全视距', '慢行'],
    useFor: '用于街旁绿地、道路界面和慢行绿化系统的设计核查。',
  },
  {
    name: '上海市绿地设计规范',
    code: 'DG/TJ 08-15',
    category: '地方标准',
    focus: ['上海', '绿地设计', '地方控制', '植物配置', '公园绿地'],
    useFor: '上海项目需要优先结合地方绿地设计要求核查。',
  },
  {
    name: '上海市绿化条例',
    code: '地方条例',
    category: '地方标准',
    focus: ['上海', '绿化管理', '绿线', '保护要求', '实施管理'],
    useFor: '涉及上海绿化管理、绿线保护和实施边界时作为政策依据。',
  },
]

const projectTypeOptions = ['社区公园', '滨水绿地', '校园绿地', '广场绿地', '城市更新绿地', '街旁绿地', '防护绿地']
const currentStageOptions = ['任务书分析', '场地调研', '概念生成', '总平面推敲', '专项设计', '汇报表达']
const focusOptions = ['项目推进', '空间组织', '慢行流线', '功能分区', '植物配置', '海绵策略', '全龄友好', '规范风险', '案例借鉴']
const outputOptions = ['案例介绍', '借鉴方法', '相关规范名称', '匹配关键词', '使用提醒']
const outputGuide = [
  {
    title: '案例介绍',
    description: '说明匹配到哪些案例、案例解决了什么问题、为什么和当前项目相关。',
  },
  {
    title: '借鉴方法',
    description: '从匹配案例中提炼可以迁移到当前项目的具体设计方法。',
  },
  {
    title: '相关规范名称',
    description: '根据案例关键词匹配应优先查看的绿地规划与设计规范名称。',
  },
  {
    title: '匹配关键词',
    description: '展示系统从案例中提取出的规范检索关键词，如滨水、慢行、全龄友好。',
  },
  {
    title: '使用提醒',
    description: '提醒哪些案例方法可以借鉴、哪些地方不能直接照搬。',
  },
]

const caseAssistantQuickCases = [
  {
    title: '城市街角口袋公园',
    meta: '0.6 ha · 高密度居住区改造',
    question: '高密度中心区滨水商业景观，存在滨河高差与界面压迫',
  },
  {
    title: '滨水带状绿地',
    meta: '12 ha · 防护 + 游憩复合',
    question: '城市中心区滨水用地，紧邻高架，商业区与滨河绿带存在高差，希望解决界面压迫并把河岸资源转化为可停留的公共空间',
  },
  {
    title: '校园中心绿地',
    meta: '2.3 ha · 教育用地附属',
    question: '校园中心绿地需要兼顾通行、学习交流和雨水调蓄，帮我匹配案例并说明哪些方法可以迁移',
  },
  {
    title: '屋顶花园',
    meta: '0.3 ha · 商业综合体顶层',
    question: '商业综合体屋顶花园面积约 0.3 公顷，需要兼顾休憩和轻量化种植，帮我提炼案例策略和规范关注点',
  },
]

const SectionShell: FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-[20px] border border-[#dfe7dc] bg-white ${className}`}>
    {children}
  </div>
)

function parseJsonLikeContent(content: string): AssistantResult | null {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim()
  const unescapedCleaned = unescapeJsonLikeText(cleaned)
  const looseSpecCases = dedupeSpecCaseItems([
    ...extractSpecCasesFromLooseText(cleaned),
    ...extractSpecCasesFromLooseText(unescapedCleaned),
  ])
  const looseCaseSuggestions = dedupeByCaseTitle([
    ...extractCaseSuggestionsFromLooseText(cleaned),
    ...extractCaseSuggestionsFromLooseText(unescapedCleaned),
  ])

  try {
    return mergeAssistantResults([
      JSON.parse(cleaned),
      ...(looseSpecCases.length ? [{ spec_cases: looseSpecCases }] : []),
      ...(looseCaseSuggestions.length ? [{ case_suggestions: looseCaseSuggestions }] : []),
    ])
  }
  catch {
    // If Dify appended multiple JSON objects or extra text, parse each object separately.
  }

  const parsedCandidates = extractJsonObjects(cleaned)
    .map((candidate) => {
      try {
        return JSON.parse(candidate) as AssistantResult
      }
      catch {
        return null
      }
    })
    .filter((candidate): candidate is AssistantResult => Boolean(candidate))

  const mergedResult = mergeAssistantResults([
    ...parsedCandidates,
    ...(looseSpecCases.length ? [{ spec_cases: looseSpecCases }] : []),
    ...(looseCaseSuggestions.length ? [{ case_suggestions: looseCaseSuggestions }] : []),
  ])

  return mergedResult || null
}

function unescapeJsonLikeText(content: string) {
  return content
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
}

function stringifyWorkflowOutput(value: unknown): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  const nestedStrings = collectWorkflowStrings(value)

  try {
    return [
      ...nestedStrings,
      JSON.stringify(value),
    ].filter(Boolean).join('\n')
  }
  catch {
    return nestedStrings.join('\n')
  }
}

function collectWorkflowStrings(value: unknown): string[] {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => collectWorkflowStrings(item))
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(item => collectWorkflowStrings(item))
  }

  return []
}

function mergeAssistantResults(results: AssistantResult[]) {
  if (!results.length) {
    return null
  }

  const merged = results.reduce<AssistantResult>((current, item) => ({
    ...current,
    ...item,
    cases_analysis: [
      ...(current.cases_analysis || []),
      ...(item.cases_analysis || []),
    ],
    case_suggestions: [
      ...(current.case_suggestions || []),
      ...(item.case_suggestions || []),
    ],
    cases: [
      ...(current.cases || []),
      ...(item.cases || []),
      ...(item.case_name ? [{ name: item.case_name, specs: item.specs || [] }] : []),
    ],
    spec_cases: [
      ...(current.spec_cases || []),
      ...(item.spec_cases || []),
      ...(item.case_name ? [{ case_name: item.case_name, search_queries: item.search_queries, specs: item.specs || [] }] : []),
    ],
    related_norm_names: [
      ...(current.related_norm_names || []),
      ...(item.related_norm_names || []),
    ],
    next_steps: [
      ...(current.next_steps || []),
      ...(item.next_steps || []),
    ],
  }), {})

  return {
    ...merged,
    cases_analysis: dedupeByCaseTitle(merged.cases_analysis || []),
    case_suggestions: dedupeByCaseTitle(merged.case_suggestions || []),
    cases: dedupeSpecCases(merged.cases || []),
    spec_cases: dedupeSpecCaseItems(merged.spec_cases || []),
    related_norm_names: [...new Set(merged.related_norm_names || [])],
    next_steps: [...new Set(merged.next_steps || [])],
  }
}

function extractJsonObjects(content: string) {
  const objects: string[] = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]

    if (inString) {
      if (escaped) {
        escaped = false
      }
      else if (char === '\\') {
        escaped = true
      }
      else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        start = index
      }
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        objects.push(content.slice(start, index + 1))
        start = -1
      }
    }
  }

  return objects
}

function extractSpecCasesFromLooseText(content: string): NonNullable<AssistantResult['spec_cases']> {
  const specCases: NonNullable<AssistantResult['spec_cases']> = []
  const caseNamePattern = /"case_name"\s*:\s*"([^"]+)"/g
  let match = caseNamePattern.exec(content)

  while (match) {
    const caseName = match[1]
    const nextMatch = caseNamePattern.exec(content)
    const searchStart = match.index + match[0].length
    const searchEnd = nextMatch?.index || content.length
    const segment = content.slice(searchStart, searchEnd)
    const specsKeyIndex = segment.search(/"specs"\s*:\s*\[/)

    if (specsKeyIndex < 0) {
      match = nextMatch
      continue
    }

    const specsArrayStart = searchStart + specsKeyIndex + segment.slice(specsKeyIndex).indexOf('[')
    const specsArrayText = extractBracketedArray(content, specsArrayStart)

    if (!specsArrayText) {
      match = nextMatch
      continue
    }

    try {
      const specs = JSON.parse(specsArrayText) as CaseSpec[]
      if (Array.isArray(specs) && specs.length) {
        specCases.push({ case_name: caseName, specs })
      }
    }
    catch {
      // Ignore malformed specs snippets; strict JSON objects are still parsed above.
    }

    match = nextMatch
  }

  return specCases
}

function extractCaseSuggestionsFromLooseText(content: string): NonNullable<AssistantResult['case_suggestions']> {
  const suggestions: NonNullable<AssistantResult['case_suggestions']> = []
  const caseTitlePattern = /"case_title"\s*:\s*"([^"]+)"/g
  let match = caseTitlePattern.exec(content)

  while (match) {
    const caseTitle = match[1]
    const nextMatch = caseTitlePattern.exec(content)
    const searchStart = match.index + match[0].length
    const searchEnd = nextMatch?.index || content.length
    const segment = content.slice(searchStart, searchEnd)
    const contentKeyIndex = segment.search(/"content"\s*:\s*\[/)

    if (contentKeyIndex < 0) {
      match = nextMatch
      continue
    }

    const contentArrayStart = searchStart + contentKeyIndex + segment.slice(contentKeyIndex).indexOf('[')
    const contentArrayText = extractBracketedArray(content, contentArrayStart)

    if (!contentArrayText) {
      match = nextMatch
      continue
    }

    try {
      const contentItems = JSON.parse(contentArrayText) as string[]
      if (Array.isArray(contentItems) && contentItems.length) {
        suggestions.push({ case_title: caseTitle, content: contentItems })
      }
    }
    catch {
      // Ignore malformed content snippets; strict JSON objects are still parsed above.
    }

    match = nextMatch
  }

  return suggestions
}

function extractBracketedArray(content: string, startIndex: number) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = startIndex; index < content.length; index += 1) {
    const char = content[index]

    if (inString) {
      if (escaped) {
        escaped = false
      }
      else if (char === '\\') {
        escaped = true
      }
      else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '[') {
      depth += 1
      continue
    }

    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return content.slice(startIndex, index + 1)
      }
    }
  }

  return ''
}

function normalizeCaseName(name = '') {
  return name
    .replace(/\s+/g, '')
    .replace(/[｜|/／·\-—–_，,。:：]/g, '')
    .toLowerCase()
}

function getCaseTitle(item?: {
  case_title?: string
  case_name?: string
  title?: string
  name?: string
}) {
  return item?.case_title || item?.case_name || item?.title || item?.name || ''
}

function isSameCaseName(left = '', right = '') {
  const normalizedLeft = normalizeCaseName(left)
  const normalizedRight = normalizeCaseName(right)
  return Boolean(normalizedLeft && normalizedRight && (normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)))
}

function dedupeByCaseTitle<T extends { case_title?: string, case_name?: string, title?: string, name?: string }>(items: T[]) {
  return items.reduce<T[]>((deduped, item) => {
    const title = getCaseTitle(item)
    const existingIndex = deduped.findIndex(existing => isSameCaseName(getCaseTitle(existing), title))
    if (existingIndex < 0) {
      deduped.push(item)
      return deduped
    }

    const existingItem = deduped[existingIndex] as T & { content?: string[] }
    const incomingItem = item as T & { content?: string[] }

    deduped[existingIndex] = {
      ...deduped[existingIndex],
      ...item,
      content: incomingItem.content?.length ? incomingItem.content : existingItem.content,
    }
    return deduped
  }, [])
}

function dedupeSpecCases(items: NonNullable<AssistantResult['cases']>) {
  return items.reduce<NonNullable<AssistantResult['cases']>>((deduped, item) => {
    const title = getCaseTitle(item)
    const existingIndex = deduped.findIndex(existing => isSameCaseName(getCaseTitle(existing), title))
    if (existingIndex < 0) {
      deduped.push(item)
      return deduped
    }

    deduped[existingIndex] = {
      ...deduped[existingIndex],
      ...item,
      specs: dedupeCaseSpecs([
        ...(deduped[existingIndex].specs || []),
        ...(item.specs || []),
      ]),
    }
    return deduped
  }, [])
}

function dedupeSpecCaseItems(items: NonNullable<AssistantResult['spec_cases']>) {
  return items.reduce<NonNullable<AssistantResult['spec_cases']>>((deduped, item) => {
    const title = item.case_name || ''
    const existingIndex = deduped.findIndex(existing => isSameCaseName(existing.case_name, title))
    if (existingIndex < 0) {
      deduped.push(item)
      return deduped
    }

    deduped[existingIndex] = {
      ...deduped[existingIndex],
      ...item,
      specs: dedupeCaseSpecs([
        ...(deduped[existingIndex].specs || []),
        ...(item.specs || []),
      ]),
    }
    return deduped
  }, [])
}

function dedupeCaseSpecs(specs: CaseSpec[] = []) {
  return specs.reduce<CaseSpec[]>((deduped, spec) => {
    const key = normalizeCaseName(`${spec.code || ''}${spec.name || ''}`)
    const existingIndex = deduped.findIndex(item => normalizeCaseName(`${item.code || ''}${item.name || ''}`) === key)

    if (!key || existingIndex < 0) {
      deduped.push(spec)
      return deduped
    }

    const existing = deduped[existingIndex]
    deduped[existingIndex] = {
      ...existing,
      ...spec,
      reason: existing.reason || spec.reason,
      relatedIndicators: [...new Set([
        ...(existing.relatedIndicators || []),
        ...(spec.relatedIndicators || []),
      ])],
      keywords: [...new Set([
        ...(existing.keywords || []),
        ...(spec.keywords || []),
      ])],
    }
    return deduped
  }, [])
}

function firstText(...values: Array<string | undefined>) {
  return values.find(value => Boolean(value?.trim()))?.trim()
}

function normalizeContentItem(item: string) {
  return item.trim().replace(/^[-*]\s*/, '')
}

function normalizeContentItems(content: CaseContent): string[] {
  if (!content) {
    return []
  }

  if (Array.isArray(content)) {
    return content.flatMap(item => normalizeContentItems(item))
  }

  if (typeof content === 'string') {
    return unescapeJsonLikeText(content)
      .split(/\r?\n/)
      .map(item => normalizeContentItem(item))
      .map(item => item.replace(/^["'“”]+/, '').replace(/["'“”,，]+$/, '').trim())
      .filter(Boolean)
  }

  if (typeof content === 'object') {
    return Object.entries(content as Record<string, unknown>).flatMap(([key, value]) => {
      if (value === undefined || value === null) {
        return []
      }

      if (typeof value === 'string' || typeof value === 'number') {
        return [`${key}：${value}`]
      }

      return normalizeContentItems(value)
    })
  }

  return []
}

function splitLabeledContentItem(item: string) {
  const normalized = normalizeContentItem(item)
  const matched = normalized.match(/^([^:：]{2,12})[:：]\s*([\s\S]*)$/)
  if (!matched) {
    return null
  }

  return {
    title: matched[1].trim(),
    text: matched[2].trim(),
  }
}

function pickLabeledContent(content: CaseContent, labels: string[]) {
  const matched = normalizeContentItems(content).find((item) => {
    const normalized = normalizeContentItem(item)
    return labels.some(label => normalized.startsWith(`${label}:`) || normalized.startsWith(`${label}：`))
  })

  if (!matched) {
    return undefined
  }

  return normalizeContentItem(matched).replace(new RegExp(`^(${labels.join('|')})[:：]\\s*`), '').trim()
}

function getContentSections(suggestion: {
  content?: CaseContent
  summary?: string
  self_summary?: string
  relevance?: string
  site_problem?: string
  site_problems?: string
  design_strategy?: string
  design_strategies?: string
}) {
  const sections = normalizeContentItems(suggestion.content)
    .map(splitLabeledContentItem)
    .filter((item): item is { title: string, text: string } => Boolean(item?.title && item.text))

  if (sections.length) {
    return sections
  }

  return [
    {
      title: '自写摘要',
      text: firstText(suggestion.summary, suggestion.self_summary, suggestion.relevance) || '',
    },
    {
      title: '场地问题',
      text: firstText(suggestion.site_problem, suggestion.site_problems) || '',
    },
    {
      title: '设计策略',
      text: firstText(suggestion.design_strategy, suggestion.design_strategies) || '',
    },
  ].filter(item => item.text)
}

function normalizeCaseDetailTitle(title: string) {
  const normalized = title.trim()
  const titleMap: Record<string, string> = {
    项目地点: '地点',
    设计公司: '公司',
    类型: '项目类型',
    项目面积: '面积',
    摘要: '自写摘要',
    问题: '场地问题',
    策略: '设计策略',
  }

  return titleMap[normalized] || normalized
}

function cleanExtractedSectionText(text: string) {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim()
    .replace(/^["'“”\s]+/, '')
    .replace(/["'“”\s,，\]\}]+$/, '')
    .trim()
}

function extractLabeledContentGroups(content: string) {
  const source = unescapeJsonLikeText(content)
  const groups: Array<Array<{ title: string, text: string }>> = []
  const pattern = /自写摘要[:：]\s*([\s\S]*?)场地问题[:：]\s*([\s\S]*?)设计策略[:：]\s*([\s\S]*?)(?=(?:自写摘要[:：]|"case_title"|case_title|"project_suggestions"|project_suggestions|"next_steps"|next_steps|\]\s*,\s*\{|\]\s*\}|$))/g
  let match = pattern.exec(source)

  while (match) {
    const sections = [
      { title: '自写摘要', text: cleanExtractedSectionText(match[1]) },
      { title: '场地问题', text: cleanExtractedSectionText(match[2]) },
      { title: '设计策略', text: cleanExtractedSectionText(match[3]) },
    ].filter(item => item.text)

    if (sections.length >= 2) {
      groups.push(sections)
    }

    match = pattern.exec(source)
  }

  return groups
}

function extractContentSectionsForCase(content: string, title = '', caseIndex = 0) {
  const sourceVariants = [content, unescapeJsonLikeText(content)]
  const labeledGroups = extractLabeledContentGroups(content)

  if (labeledGroups[caseIndex]?.length) {
    return labeledGroups[caseIndex]
  }

  for (const source of sourceVariants) {
    const suggestions = extractCaseSuggestionsFromLooseText(source)
    const matchedSuggestion = suggestions.find(item => isSameCaseName(item.case_title, title)) || suggestions[caseIndex]
    const sections = matchedSuggestion ? getContentSections(matchedSuggestion) : []

    if (sections.length >= 2) {
      return sections
    }
  }

  return []
}

function buildCasePanelItems(result: AssistantResult | null): CasePanelItem[] {
  const isKnowledgeFileTitle = (title = '') => /\.(md|txt|pdf|docx?|xlsx?)$/i.test(title.trim())
  const analysisCases = (result?.cases_analysis || []).filter(item => !isKnowledgeFileTitle(item.case_title))
  if (analysisCases.length) {
    return analysisCases.map((item): CasePanelItem => {
      const specs = dedupeCaseSpecs(item.specs || [])
      const contentSections = getContentSections(item)

      return {
        title: item.case_title || '未命名案例',
        link: item.case_link,
        location: firstText(item.location, item.project_location, pickLabeledContent(item.content, ['地点', '项目地点'])),
        company: firstText(item.company, item.design_company, pickLabeledContent(item.content, ['公司', '设计公司'])),
        projectType: firstText(item.project_type, item.type, pickLabeledContent(item.content, ['项目类型', '类型'])),
        area: firstText(item.area, pickLabeledContent(item.content, ['面积', '项目面积'])),
        summary: pickLabeledContent(item.content, ['自写摘要', '摘要']),
        siteProblem: pickLabeledContent(item.content, ['场地问题', '问题']),
        designStrategy: pickLabeledContent(item.content, ['设计策略', '策略']),
        contentSections,
        relevance: item.relevance,
        methods: item.methods || [],
        suggestions: item.project_suggestions || [],
        specs,
        keywords: specs.flatMap(spec => spec.keywords || []).slice(0, 6),
      }
    })
  }

  const standardCases = (result?.cases || []).filter((item) => {
    const title = getCaseTitle(item)
    const contentSections = getContentSections(item)
    const looksLikeKnowledgeFile = isKnowledgeFileTitle(title)

    return !looksLikeKnowledgeFile && contentSections.length >= 2
  })
  const suggestions = standardCases.length
    ? standardCases.map(item => ({
      case_title: getCaseTitle(item),
      case_link: item.case_link || item.link,
      content: item.content,
      relevance: item.relevance || item.reason,
      methods: item.methods,
      project_suggestions: item.project_suggestions,
      specs: item.specs,
    }))
    : (result?.case_suggestions || [])
  const specCases = [
    ...(result?.spec_cases || []).map(item => ({
      name: item.case_name,
      specs: item.specs || [],
    })),
    ...(result?.cases || []),
  ]
  const items = suggestions.map((suggestion, index): CasePanelItem => {
    const title = getCaseTitle(suggestion)
    const matchedSpecCase = specCases.find(item => isSameCaseName(getCaseTitle(item), title)) || specCases[index]
    const specs = dedupeCaseSpecs(matchedSpecCase?.specs?.length
      ? matchedSpecCase.specs
      : (suggestion.specs || []))
    const contentSections = getContentSections(suggestion)

    return {
      title: title || '未命名案例',
      link: firstText(suggestion.case_link, suggestion.link),
      location: firstText(suggestion.location, suggestion.project_location),
      company: firstText(suggestion.company, suggestion.design_company),
      projectType: firstText(suggestion.project_type, suggestion.type),
      area: suggestion.area,
      summary: firstText(suggestion.summary, suggestion.self_summary, pickLabeledContent(suggestion.content, ['自写摘要', '摘要'])),
      siteProblem: firstText(suggestion.site_problem, suggestion.site_problems, pickLabeledContent(suggestion.content, ['场地问题', '问题'])),
      designStrategy: firstText(suggestion.design_strategy, suggestion.design_strategies, pickLabeledContent(suggestion.content, ['设计策略', '策略'])),
      contentSections,
      relevance: suggestion.relevance,
      methods: suggestion.methods || [],
      suggestions: suggestion.project_suggestions || [],
      specs,
      keywords: [
        ...(suggestion.regulation_focus || []),
        ...specs.flatMap(spec => spec.keywords || []),
      ].slice(0, 6),
    }
  })

  return items
}

function getSpecsForActiveCase(result: AssistantResult | null, title = '', index = 0) {
  const analysisCases = (result?.cases_analysis || []).filter(item => item.specs?.length)
  const matchedAnalysisCase = analysisCases.find(item => isSameCaseName(item.case_title, title)) || analysisCases[index]
  if (matchedAnalysisCase?.specs?.length) {
    return dedupeCaseSpecs(matchedAnalysisCase.specs)
  }

  const standardCases = (result?.cases || []).filter(item => item.specs?.length)
  const matchedStandardCase = standardCases.find(item => isSameCaseName(getCaseTitle(item), title)) || standardCases[index]
  if (matchedStandardCase?.specs?.length) {
    return dedupeCaseSpecs(matchedStandardCase.specs)
  }

  const specCases = [
    ...(result?.spec_cases || []).map(item => ({
      name: item.case_name,
      specs: item.specs || [],
    })),
    ...(result?.cases || []),
  ].filter(item => item.specs?.length)

  const matchedByTitle = specCases.find(item => isSameCaseName(getCaseTitle(item), title))
  const matchedByIndex = specCases[index]

  return matchedByTitle?.specs?.length
    ? dedupeCaseSpecs(matchedByTitle.specs)
    : dedupeCaseSpecs(matchedByIndex?.specs || [])
}

function scoreCase(courseCase: CourseCase, form: ProjectForm) {
  const haystack = [
    courseCase.projectType,
    courseCase.siteConditions,
    courseCase.designTasks,
    courseCase.description,
    ...courseCase.strategies,
    ...courseCase.relatedCodes,
  ].join(' ')

  let score = courseCase.projectType === form.projectType ? 4 : 0
  form.focuses.forEach((focus) => {
    if (haystack.includes(focus)) {
      score += 2
    }
  })

  const keywords = form.question
    .split(/[\s,，。；;、]/)
    .map(item => item.trim())
    .filter(item => item.length >= 2)

  keywords.forEach((keyword) => {
    if (haystack.includes(keyword)) {
      score += 1
    }
  })

  return score
}

function getRelevantSpecs(form: ProjectForm, cases: CourseCase[], caseKeywords: string[] = []) {
  const caseCodeNames = new Set(cases.flatMap(item => item.relatedCodes))
  const queryText = [
    form.projectType,
    form.currentStage,
    form.siteCondition,
    form.question,
    ...form.focuses,
    ...form.outputNeeds,
    ...caseKeywords,
  ].join(' ')

  return normativeSpecs
    .map((spec) => {
      let score = caseCodeNames.has(spec.name) ? 4 : 0

      spec.focus.forEach((focus) => {
        if (queryText.includes(focus)) {
          score += 2
        }
      })

      if (form.projectType.includes('社区') && spec.focus.some(item => ['社区公园', '居住绿地', '儿童老人'].includes(item))) {
        score += 3
      }

      if (form.projectType.includes('滨水') && spec.focus.some(item => ['绿道', '滨水', '慢行'].includes(item))) {
        score += 3
      }

      if (form.focuses.includes('全龄友好') && spec.focus.some(item => ['无障碍', '全龄友好', '儿童老人'].includes(item))) {
        score += 3
      }

      if (form.focuses.includes('海绵策略') && spec.focus.some(item => ['绿地设计', '竖向', '水体'].includes(item))) {
        score += 2
      }

      return { spec, score }
    })
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .slice(0, 5)
    .map(item => item.spec)
}

function getMatchedCases(form: ProjectForm) {
  return [...typedCourseCases]
    .map(item => ({ item, score: scoreCase(item, form) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item)
}

function getCaseKeywords(cases: CourseCase[], form: ProjectForm) {
  const source = [
    form.projectType,
    ...form.focuses,
    ...cases.flatMap(item => [
      item.projectType,
      item.designTasks,
      ...item.strategies,
      ...item.relatedCodes,
      ...item.usableMethods,
    ]),
  ].join(' ')

  const keywordPool = ['社区', '滨水', '校园', '广场', '城市更新', '街旁', '防护', '慢行', '绿道', '功能分区', '植物配置', '海绵', '雨水', '全龄友好', '儿童', '老人', '无障碍', '活动场地', '遮阴', '停留', '生态缓冲', '道路绿化', '公园绿地', '居住绿地']

  const matchedKeywords = keywordPool.filter(keyword => source.includes(keyword))
  const questionKeywords = form.question
    .split(/[\s,，。；;、]/)
    .map(item => item.trim())
    .filter(item => item.length >= 2 && item.length <= 8)

  return [...new Set([...matchedKeywords, ...questionKeywords])].slice(0, 10)
}

interface ProjectForm {
  projectType: string
  currentStage: string
  siteCondition: string
  question: string
  focuses: string[]
  outputNeeds: string[]
}

const ProjectAssistant: FC<IProjectAssistantProps> = ({ isMobile = false }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [rawAnswer, setRawAnswer] = useState('')
  const [workflowOutputText, setWorkflowOutputText] = useState('')
  const [parsedResult, setParsedResult] = useState<AssistantResult | null>(null)
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [assistantHistory, setAssistantHistory] = useState<Array<{ id: string, question: string }>>([])
  const [matchedCases, setMatchedCases] = useState<CourseCase[]>(typedCourseCases.slice(0, 3))
  const [relevantSpecs, setRelevantSpecs] = useState(() => getRelevantSpecs({
    projectType: projectTypeOptions[0],
    currentStage: currentStageOptions[0],
    siteCondition: '',
    question: '',
    focuses: ['项目推进', '案例借鉴', '规范风险'],
    outputNeeds: ['案例介绍', '借鉴方法', '相关规范名称', '匹配关键词'],
  }, typedCourseCases.slice(0, 3)))
  const [form, setForm] = useState<ProjectForm>({
    projectType: projectTypeOptions[0],
    currentStage: currentStageOptions[0],
    siteCondition: '',
    question: '',
    focuses: ['项目推进', '案例借鉴', '规范风险'],
    outputNeeds: ['案例介绍', '借鉴方法', '相关规范名称', '匹配关键词'],
  })

  const toggleFocus = (focus: string) => {
    setForm(current => ({
      ...current,
      focuses: current.focuses.includes(focus)
        ? current.focuses.filter(item => item !== focus)
        : [...current.focuses, focus],
    }))
  }

  const toggleOutputNeed = (outputNeed: string) => {
    setForm(current => ({
      ...current,
      outputNeeds: current.outputNeeds.includes(outputNeed)
        ? current.outputNeeds.filter(item => item !== outputNeed)
        : [...current.outputNeeds, outputNeed],
    }))
  }

  const handleGenerate = async () => {
    if (isGenerating) {
      return
    }

    if (!form.question.trim()) {
      Toast.notify({ type: 'info', message: '请先描述当前项目问题' })
      return
    }

    setParsedResult(null)
    setRawAnswer('')
    setWorkflowOutputText('')
    setSelectedCaseIndex(0)
    setIsGenerating(true)
    setAssistantHistory((current) => {
      const question = form.question.trim()
      const withoutDuplicate = current.filter(item => item.question !== question)
      return [{ id: `${Date.now()}`, question }, ...withoutDuplicate].slice(0, 6)
    })

    const nextMatchedCases = getMatchedCases(form)
    const nextCaseKeywords = getCaseKeywords(nextMatchedCases, form)
    const nextRelevantSpecs = getRelevantSpecs(form, nextMatchedCases, nextCaseKeywords)
    setMatchedCases(nextMatchedCases)
    setRelevantSpecs(nextRelevantSpecs)

    const payload = {
      task_type: 'case_assistant',
      retrieval_chain: '用户问题 -> Dify 案例知识库检索 -> 提取案例关键词 -> Dify 规范知识库检索 -> 逐案例生成建议',
      user_question: form.question,
      retrieval_inputs: {
        case_query: form.question,
        norm_query_hint: '由 Dify 根据命中的案例内容和用户问题提取关键词后检索规范知识库',
      },
      output_schema: {
        overall_judgement: '用户项目的总体问题判断。',
        cases_analysis: [
          {
            case_title: '案例标题，必须来自 Dify 案例知识库检索结果',
            case_link: '案例链接，必须来自 Dify 案例知识库检索结果；如果没有链接则为空字符串',
            location: '项目地点，例如 上海青浦；如果知识库没有则为空字符串',
            company: '设计公司，例如 上海魏玛设计；如果知识库没有则为空字符串',
            project_type: '项目类型，例如 售楼中心展示区 / 滨水公园商业景观；如果知识库没有则为空字符串',
            area: '项目面积，例如 16000㎡；如果知识库没有则为空字符串',
            search_queries: '这个案例用于检索规范知识库的关键词',
            relevance: '这个案例为什么和用户问题相关',
            specs: [
              {
                name: '该案例对应的规范名称',
                code: '规范编号；如果没有则为空字符串',
                reason: '该规范为什么对应当前案例',
                relatedIndicators: ['与案例相关的指标或检查项'],
                keywords: ['用于规范检索的关键词'],
              },
            ],
            content: ['自写摘要：...', '场地问题：...', '设计策略：...'],
            project_suggestions: ['给当前项目的具体建议'],
          },
        ],
        next_steps: ['下一步行动'],
      },
      output_requirements: [
        '只输出 JSON，不要 Markdown，不要解释文字。',
        '只能输出一个 JSON 对象，不要追加第二个 JSON。',
        '不要用 ```json 或 ``` 包裹输出。',
        '必须使用 cases_analysis 作为唯一案例主数组；每个 cases_analysis[i] 必须同时包含该案例的 case_title、case_link、location、company、project_type、area、search_queries、relevance、specs、content、project_suggestions。',
        'content 必须按数组输出，至少包含“自写摘要：...”“场地问题：...”“设计策略：...”。地点、公司、项目类型、面积要优先放在独立字段里。',
        '不要再输出独立的 cases、case_suggestions、spec_cases、cases/specs 调试结果或中间变量。',
        '必须优先使用 Dify 案例知识库检索到的案例，不要使用前端示例案例作为正式依据。',
        'cases_analysis 必须和 Dify 案例知识库命中的主要案例一一对应，建议输出 3-5 个。',
        '不要编造案例标题、链接、规范条文编号。',
        'project_suggestions 要具体到项目怎么做。',
        '如果案例知识库没有检索到相关案例，应在 overall_judgement 中说明“当前案例库未检索到高度相关案例”。',
        '如果信息不足，用“当前资料不足以判断”。',
      ],
    }

    const responseItem = { content: '' }
    const workflowOutputItem = { content: '' }
    let temporaryConversationId = ''

    const collectWorkflowOutput = (outputs: unknown) => {
      const outputText = stringifyWorkflowOutput(outputs)
      if (!outputText) {
        return
      }

      workflowOutputItem.content += `\n${outputText}`
      setWorkflowOutputText(workflowOutputItem.content)
    }

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
        // Keep the result available even if conversation cleanup fails.
      }
    }

    await sendChatMessage({
      inputs: {},
      query: JSON.stringify(payload, null, 2),
      conversation_id: null,
    }, {
      onData: (nextMessage: string, _isFirstMessage, moreInfo) => {
        if (moreInfo?.conversationId) {
          temporaryConversationId = moreInfo.conversationId
        }
        responseItem.content += nextMessage
        setRawAnswer(responseItem.content)
      },
      onCompleted: async () => {
        const combinedContent = `${responseItem.content}\n${workflowOutputItem.content}`.trim()
        const result = parseJsonLikeContent(combinedContent)
        setRawAnswer(combinedContent)
        setParsedResult(result)
        if (!result) {
          Toast.notify({ type: 'info', message: '已返回内容，但没有解析到结构化案例建议' })
        }
        await cleanupTemporaryConversation()
        setIsGenerating(false)
      },
      onError: async () => {
        await cleanupTemporaryConversation()
        setIsGenerating(false)
      },
      onThought: () => {},
      onFile: () => {},
      onMessageEnd: () => {},
      onMessageReplace: () => {},
      onWorkflowStarted: () => {},
      onNodeStarted: () => {},
      onNodeFinished: ({ data }) => {
        collectWorkflowOutput(data?.outputs)
      },
      onWorkflowFinished: ({ data }) => {
        collectWorkflowOutput(data?.outputs)
      },
    })
  }

  const visibleCaseKeywords = getCaseKeywords(matchedCases, form)
  const combinedAnswer = `${rawAnswer}\n${workflowOutputText}`.trim()
  const reparsedResult = combinedAnswer ? parseJsonLikeContent(combinedAnswer) : null
  const effectiveParsedResult = mergeAssistantResults([
    ...(parsedResult ? [parsedResult] : []),
    ...(reparsedResult ? [reparsedResult] : []),
  ])
  const hasCasesAnalysisResult = Boolean(effectiveParsedResult?.cases_analysis?.length)
  const hasStarted = isGenerating || !!rawAnswer || !!effectiveParsedResult
  const casePanelItems = buildCasePanelItems(effectiveParsedResult)
  const hasDifyCasePanel = casePanelItems.length > 0
  const activeCase = casePanelItems[selectedCaseIndex] || casePanelItems[0]
  const primaryCase = hasDifyCasePanel ? undefined : (matchedCases[selectedCaseIndex] || matchedCases[0])
  const resultCaseCount = casePanelItems.length || 1
  const activeCaseSpecs = getSpecsForActiveCase(effectiveParsedResult, activeCase?.title, selectedCaseIndex)
  const relatedSpecs = casePanelItems.length
    ? activeCaseSpecs
    : (
      activeCase?.specs?.length
        ? activeCase.specs
        : relevantSpecs.slice(0, 2).map(spec => ({
          name: spec.name,
          code: spec.code,
          reason: spec.useFor,
          keywords: spec.focus,
        }))
    )
  const activeLink = activeCase?.link || primaryCase?.link
  const activeSummary = activeCase?.summary || activeCase?.relevance || primaryCase?.description || effectiveParsedResult?.overall_judgement || '正在检索相似案例，并结合规范知识库生成可借鉴的方法。'
  const activeSiteProblem = activeCase?.siteProblem || primaryCase?.siteConditions
  const activeDesignStrategy = activeCase?.designStrategy || primaryCase?.strategies?.join('；')
  const directlyExtractedContentSections = extractContentSectionsForCase(combinedAnswer, activeCase?.title, selectedCaseIndex)
  const activeContentSections = hasCasesAnalysisResult && activeCase?.contentSections?.length
    ? activeCase.contentSections
    : (
      directlyExtractedContentSections.length
        ? directlyExtractedContentSections
        : activeCase?.contentSections?.length
          ? activeCase.contentSections
          : [
            { title: '自写摘要', text: activeSummary },
            { title: '场地问题', text: activeSiteProblem },
            { title: '设计策略', text: activeDesignStrategy },
          ].filter((item): item is { title: string, text: string } => Boolean(item.text))
    )
  const methodItems = [
    ...(activeCase?.methods || []).map(method => ({
      label: '策略',
      text: method,
    })),
    ...(activeCase?.suggestions || []).map(suggestion => ({
      label: '做法',
      text: suggestion,
    })),
  ].slice(0, 3)
  const activeProjectSuggestions = [
    ...(activeCase?.suggestions || []),
    ...(activeCase?.suggestions?.length ? [] : methodItems.map(item => item.text)),
    ...(activeCase?.suggestions?.length || methodItems.length ? [] : [activeCase?.relevance || effectiveParsedResult?.overall_judgement || '当前资料不足以判断。']),
  ].filter(Boolean)
  const activeCaseTags = [
    activeCase?.location,
    activeCase?.area,
    activeCase?.projectType,
  ].filter(Boolean).slice(0, 5)
  const activeCaseDetailSections = [
    { title: '地点', text: activeCase?.location },
    { title: '公司', text: activeCase?.company },
    { title: '项目类型', text: activeCase?.projectType },
    { title: '面积', text: activeCase?.area },
    ...activeContentSections,
  ].reduce<Array<{ title: string, text: string }>>((sections, section) => {
    if (!section.text) {
      return sections
    }

    const title = normalizeCaseDetailTitle(section.title)
    const alreadyExists = sections.some(item => item.title === title)
    if (!alreadyExists) {
      sections.push({ title, text: section.text })
    }
    return sections
  }, [])
  const hasResultPanelContent = Boolean(activeCase)

  if (hasStarted) {
    if (isGenerating) {
      return (
        <div className='flex h-full min-h-0 overflow-hidden flex-col bg-white text-[#06130c]'>
          <header className='shrink-0 bg-white'>
            <div className={`${isMobile ? 'px-4 pb-3 pt-4' : 'px-[30px] pb-3 pt-4'} shrink-0`}>
              <h1 className={`${isMobile ? 'text-[26px] leading-8' : 'text-[24px] leading-8'} font-semibold text-[#06130c]`}>案例辅助</h1>
              <p className={`${isMobile ? 'mt-1 text-[14px]' : 'mt-1 text-[13px]'} leading-5 text-[#53605a]`}>检索课程案例 · 解析可借鉴方法与规范关联</p>
            </div>
          </header>

          <main className={`${isMobile ? 'px-4 py-3' : 'px-[30px] pb-5 pt-3'} min-h-0 flex-1 overflow-hidden bg-white`}>
            <div className='mx-auto flex h-full max-w-[1200px] flex-col'>
              <section className={`${isMobile ? 'py-1' : 'py-2'}`}>
                <div className='relative flex h-[58px] items-center rounded-full border border-[#dfe7dc] bg-white pl-3 pr-[178px] shadow-[0_8px_18px_-16px_rgba(15,23,42,0.32)]'>
                  <div className='flex h-12 shrink-0 items-center pl-4 text-[#2f9e44]'>
                    <MagnifyingGlassIcon className='h-5 w-5' />
                  </div>
                  <input
                    value={form.question}
                    onChange={event => setForm(current => ({ ...current, question: event.target.value }))}
                    className='h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-[15px] leading-6 text-[#06130c] outline-none placeholder:text-[#4f6380]'
                    placeholder='项目输入：输入地块名称、面积、现状挑战...'
                  />
                  <button
                    type='button'
                    disabled
                    className={`${isMobile ? 'right-[5px] px-5 text-[14px]' : 'right-[6px] w-[160px] text-[16px]'} absolute top-1/2 inline-flex h-[46px] -translate-y-1/2 cursor-not-allowed items-center justify-center rounded-full border-0 bg-[#a9c9aa] font-semibold text-white shadow-none outline-none`}
                  >
                    分析中
                  </button>
                </div>
              </section>

              <section className='mt-5 flex min-h-0 flex-1 items-center justify-center rounded-[18px] border border-dashed border-[#c7dfc9] bg-[#f3faf2] px-5 text-center'>
                <div>
                  <FolderIcon className='mx-auto h-12 w-12 text-[#2f9e44]' />
                  <p className='mt-5 text-[18px] font-normal leading-7 text-[#06130c]'>正在检索案例与规范</p>
                </div>
              </section>
            </div>
          </main>
        </div>
      )
    }

    return (
      <div className='flex h-full min-h-0 overflow-hidden flex-col bg-white text-[#06130c]'>
        <header className='shrink-0 bg-white'>
          <div className={`${isMobile ? 'px-4 pb-3 pt-4' : 'px-[30px] pb-3 pt-4'} shrink-0`}>
            <h1 className={`${isMobile ? 'text-[26px] leading-8' : 'text-[24px] leading-8'} font-semibold text-[#06130c]`}>案例辅助</h1>
            <p className={`${isMobile ? 'mt-1 text-[14px]' : 'mt-1 text-[13px]'} leading-5 text-[#53605a]`}>检索课程案例 · 解析可借鉴方法与规范关联</p>
          </div>
        </header>

        <main className={`${isMobile ? 'px-4 py-3' : 'px-[30px] pb-5 pt-3'} min-h-0 flex-1 overflow-hidden bg-white`}>
          <div className='mx-auto flex h-full max-w-[1200px] flex-col'>
            <section className={`${isMobile ? 'py-1' : 'py-2'} shrink-0`}>
              <div className='relative flex h-[58px] items-center rounded-full border border-[#dfe7dc] bg-white pl-3 pr-[178px] shadow-[0_8px_18px_-16px_rgba(15,23,42,0.32)]'>
                <div className='flex h-12 shrink-0 items-center pl-4 text-[#2f9e44]'>
                  <MagnifyingGlassIcon className='h-5 w-5' />
                </div>
                <input
                  value={form.question}
                  onChange={event => setForm(current => ({ ...current, question: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleGenerate()
                    }
                  }}
                  className='h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-[15px] leading-6 text-[#06130c] outline-none placeholder:text-[#4f6380]'
                  placeholder='项目输入：输入地块名称、面积、现状挑战...'
                />
                <button
                  type='button'
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`${isMobile ? 'right-[5px] px-5 text-[14px]' : 'right-[6px] w-[160px] text-[16px]'} absolute top-1/2 inline-flex h-[46px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-[#2f9e44] font-semibold text-white shadow-none outline-none transition hover:bg-[#288a3d] disabled:cursor-not-allowed disabled:bg-[#c8d8c9]`}
                >
                  发送
                </button>
              </div>
            </section>

            <div className='relative mt-4 min-h-0 flex-1'>
              <button
                type='button'
                onClick={() => setSelectedCaseIndex(current => Math.max(0, current - 1))}
                disabled={selectedCaseIndex <= 0}
                className={`${isMobile ? 'hidden' : 'flex'} absolute left-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe7dc] bg-white text-[20px] text-[#2f9e44] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.38)] disabled:cursor-not-allowed disabled:text-[#c8d3c9]`}
              >
                ‹
              </button>

              <div className='h-full overflow-y-auto rounded-[18px] border border-[#dfe7dc] bg-white px-14 py-5 shadow-[0_14px_38px_-32px_rgba(15,23,42,0.32)]'>
                {hasResultPanelContent
                  ? (
                    <>
                      <section>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h2 className='mr-2 text-[18px] font-semibold leading-7 text-[#00752f]'>{activeCase?.title || primaryCase?.caseName || '未命名案例'}</h2>
                          {activeCaseTags.map(tag => (
                            <span key={tag} className='rounded-full bg-[#f3f8ef] px-2.5 py-1 text-[11px] font-normal text-[#25342b] ring-1 ring-[#dfe7dc]'>{tag}</span>
                          ))}
                          {activeLink && (
                            <a href={activeLink} target='_blank' rel='noreferrer' className='ml-auto text-[12px] font-semibold text-[#2f9e44]'>
                              查看完整案例 ↗
                            </a>
                          )}
                        </div>

                        <div className='mt-4 rounded-[14px] border border-[#e5ece2] bg-[#fbfdf9] px-5 py-4'>
                          <div className='mb-3 text-[14px] font-semibold text-[#06130c]'>案例介绍</div>
                          <div className='space-y-2.5'>
                            {activeCaseDetailSections.length > 0
                              ? activeCaseDetailSections.map(section => (
                                <div key={section.title} className='grid gap-2 text-[13px] leading-6 text-[#25342b] md:grid-cols-[84px_1fr]'>
                                  <div className='text-[#00752f]'>{section.title}：</div>
                                  <div>{section.text}</div>
                                </div>
                              ))
                              : (
                                <p className='text-[13px] leading-6 text-[#53605a]'>当前案例没有返回可展示的介绍内容。</p>
                              )}
                          </div>
                        </div>
                      </section>

                      <section className='mt-4 rounded-[14px] border border-[#cfe5cc] bg-[#f4faf2] px-5 py-4'>
                        <div className='mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#00752f]'>
                          <SparklesIcon className='h-4 w-4' />
                          项目建议
                        </div>
                        <div className='space-y-2'>
                          {activeProjectSuggestions.map((suggestion, index) => (
                            <div key={`${suggestion}-${index}`} className='flex gap-3 text-[14px] leading-7 text-[#06130c]'>
                              <span className='mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f9e44] text-[11px] font-semibold leading-none text-white'>{index + 1}</span>
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className='mt-5 border-t border-[#e5ece2] pt-4'>
                        <div className='mb-4 text-[13px] font-semibold text-[#25342b]'>关联规范：</div>
                        {relatedSpecs.length > 0
                          ? (
                            <div className='space-y-3'>
                              {relatedSpecs.map((spec, index) => (
                                <div key={`${spec.name}-${spec.code}-${index}`} className='rounded-[14px] border border-[#dfe7dc] bg-[#f7fbf4] px-5 py-4'>
                                  <div className='flex items-start justify-between gap-4'>
                                    <div className='min-w-0'>
                                      {spec.code && <div className='mb-1 text-[12px] font-semibold text-[#00752f]'>{spec.code}</div>}
                                      <div className='text-[14px] font-semibold leading-5 text-[#06130c]'>{spec.name || `规范 ${index + 1}`}</div>
                                    </div>
                                    <span className='shrink-0 rounded-full bg-[#e6f4df] px-2.5 py-1 text-[11px] font-semibold text-[#2f9e44]'>{index === 0 ? '强关联' : '推荐性'}</span>
                                  </div>
                                  {!!spec.relatedIndicators?.length && (
                                    <div className='mt-3 flex flex-wrap gap-1.5'>
                                      {spec.relatedIndicators.map(indicator => (
                                        <span key={indicator} className='rounded-full bg-white px-2 py-1 text-[11px] text-[#53605a] ring-1 ring-[#dfe7dc]'>{indicator}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                          : (
                            <div className='rounded-[14px] border border-dashed border-[#dfe7dc] bg-[#f7fbf4] px-5 py-8 text-center text-[13px] text-[#53605a]'>当前案例未返回对应规范。</div>
                          )}
                      </section>
                    </>
                  )
                  : (
                    <div className='flex h-full items-center justify-center text-center'>
                      <div>
                        <FolderIcon className='mx-auto h-11 w-11 text-[#2f9e44]' />
                        <p className='mt-4 text-[16px] font-normal text-[#06130c]'>没有解析到正式案例结果</p>
                        <p className='mt-2 text-[13px] leading-6 text-[#53605a]'>请确认 Dify 最终输出为标准 JSON，并包含 cases_analysis 数组。</p>
                      </div>
                    </div>
                  )}
              </div>

              <button
                type='button'
                onClick={() => setSelectedCaseIndex(current => Math.min(resultCaseCount - 1, current + 1))}
                disabled={selectedCaseIndex >= resultCaseCount - 1}
                className={`${isMobile ? 'hidden' : 'flex'} absolute right-3 top-1/2 z-10 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe7dc] bg-white text-[20px] text-[#2f9e44] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.38)] disabled:cursor-not-allowed disabled:text-[#c8d3c9]`}
              >
                ›
              </button>
            </div>

            <div className='mt-3 flex shrink-0 justify-center gap-2'>
              {Array.from({ length: Math.max(resultCaseCount, 1) }).map((_, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => setSelectedCaseIndex(index)}
                  className={`${index === selectedCaseIndex ? 'bg-[#2f9e44]' : 'bg-[#cfe5cc]'} h-2 w-2 rounded-full transition`}
                  aria-label={`切换到案例 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className='flex h-full min-h-0 overflow-hidden flex-col bg-white text-[#06130c]'>
      <header className='shrink-0 bg-white'>
        <div className={`${isMobile ? 'px-4 pb-3 pt-4' : 'px-[30px] pb-3 pt-4'} shrink-0`}>
          <h1 className={`${isMobile ? 'text-[26px] leading-8' : 'text-[24px] leading-8'} font-semibold text-[#06130c]`}>案例辅助</h1>
          <p className={`${isMobile ? 'mt-1 text-[14px]' : 'mt-1 text-[13px]'} leading-5 text-[#53605a]`}>检索课程案例 · 解析可借鉴方法与规范关联</p>
        </div>
      </header>

      <main className={`${isMobile ? 'px-4 py-3' : 'px-[30px] pb-5 pt-3'} min-h-0 flex-1 overflow-y-auto bg-white`}>
        {!hasStarted
          ? (
            <div className='mx-auto flex min-h-full max-w-[1200px] flex-col'>
              <section className={`${isMobile ? 'py-1' : 'py-2'}`}>
                <div className='relative flex h-[58px] items-center rounded-full border border-[#dfe7dc] bg-white pl-3 pr-[178px] shadow-[0_8px_18px_-16px_rgba(15,23,42,0.32)]'>
                  <div className='flex h-12 shrink-0 items-center pl-4 text-[#2f9e44]'>
                    <MagnifyingGlassIcon className='h-5 w-5' />
                  </div>
                  <input
                    value={form.question}
                    onChange={event => setForm(current => ({ ...current, question: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleGenerate()
                      }
                    }}
                    className='h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-[15px] leading-6 text-[#06130c] outline-none placeholder:text-[#4f6380]'
                    placeholder='项目输入：输入地块名称、面积、现状挑战...'
                  />
                  <button
                    type='button'
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`${isMobile ? 'right-[5px] px-5 text-[14px]' : 'right-[6px] w-[160px] text-[16px]'} absolute top-1/2 inline-flex h-[46px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-[#2f9e44] font-semibold text-white shadow-none outline-none transition hover:bg-[#288a3d] disabled:cursor-not-allowed disabled:bg-[#c8d8c9]`}
                  >
                    开始分析
                  </button>
                </div>
                <div className='mt-4 flex items-center gap-2 text-[13px] text-[#53605a]'>
                  <LightBulbIcon className='h-4 w-4' />
                  <span>试试这些场景</span>
                </div>
                <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-4'} mt-3 grid gap-3`}>
                  {caseAssistantQuickCases.map((item) => {
                    return (
                      <button
                        key={item.title}
                        type='button'
                        onClick={() => setForm(current => ({ ...current, question: item.question }))}
                        className='rounded-[16px] border border-[#dfe7dc] bg-white px-4 py-3 text-left text-[#06130c] transition hover:border-[#8ad29a] hover:text-[#2f9e44]'
                      >
                        <div className='text-[15px] font-normal leading-5'>{item.title}</div>
                        <div className='mt-1 text-[12px] leading-5 text-[#53605a]'>{item.meta}</div>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className='mt-5'>
                <button
                  type='button'
                  onClick={() => assistantHistory.length && setIsHistoryOpen(current => !current)}
                  className='flex items-center gap-2 text-[13px] font-normal text-[#53605a]'
                >
                  <ClockIcon className='h-4 w-4' />
                  <span>历史记录</span>
                  {!!assistantHistory.length && (
                    <>
                      <span className='rounded-full bg-[#eef3f7] px-2 py-0.5 text-[12px] text-[#5d6c80]'>{assistantHistory.length}</span>
                      <ChevronDownIcon className={`${isHistoryOpen ? 'rotate-180' : ''} h-4 w-4 transition`} />
                    </>
                  )}
                </button>
                {isHistoryOpen && !!assistantHistory.length && (
                  <div className='mt-3 grid gap-2'>
                    {assistantHistory.map(item => (
                      <button
                        key={item.id}
                        type='button'
                        onClick={() => setForm(current => ({ ...current, question: item.question }))}
                        className='rounded-[14px] border border-[#dfe7dc] bg-white px-4 py-3 text-left text-[13px] leading-5 text-[#53605a] transition hover:border-[#8ad29a] hover:text-[#2f9e44]'
                      >
                        {item.question}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className={`${isMobile ? 'min-h-[220px]' : 'min-h-[224px]'} mt-5 flex flex-1 items-center justify-center rounded-[18px] border border-dashed border-[#c7dfc9] bg-[#f3faf2] px-5 text-center`}>
                <div>
                  <FolderIcon className='mx-auto h-12 w-12 text-[#2f9e44]' />
                  <p className='mt-5 text-[18px] font-normal leading-7 text-[#06130c]'>输入你的项目需求，将从案例库中检索相似项目并解析可借鉴之处。</p>
                </div>
              </section>
            </div>
          )
          : (
            <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)]'} grid gap-5`}>
              <div className='space-y-5'>
                <SectionShell className='p-5'>
                  <div className='mb-4'>
                    <div className='flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                      <FolderIcon className='h-4 w-4 text-[#2f9e44]' />
                      输入 1 · 项目基本信息
                    </div>
                    <p className='mt-1 text-[12px] leading-5 text-[#6f7d75]'>先告诉系统你的项目是什么、做到哪一步、场地有什么限制。</p>
                  </div>

                  <div className='grid gap-4'>
                    <label className='text-[12px] text-[#53605a]'>
                      项目类型
                      <select
                        value={form.projectType}
                        onChange={event => setForm(current => ({ ...current, projectType: event.target.value }))}
                        className='mt-1 h-10 w-full rounded-[12px] border-0 bg-[#eef3ec] px-3 text-[14px] font-medium text-[#06130c] outline-none'
                      >
                        {projectTypeOptions.map(option => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>

                    <label className='text-[12px] text-[#53605a]'>
                      当前阶段
                      <select
                        value={form.currentStage}
                        onChange={event => setForm(current => ({ ...current, currentStage: event.target.value }))}
                        className='mt-1 h-10 w-full rounded-[12px] border-0 bg-[#eef3ec] px-3 text-[14px] font-medium text-[#06130c] outline-none'
                      >
                        {currentStageOptions.map(option => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>

                    <label className='text-[12px] text-[#53605a]'>
                      场地条件
                      <textarea
                        value={form.siteCondition}
                        onChange={event => setForm(current => ({ ...current, siteCondition: event.target.value }))}
                        className='mt-1 min-h-[90px] w-full resize-none rounded-[14px] border border-[#dfe7dc] bg-[#fbfdfb] px-3 py-3 text-[13px] leading-6 text-[#06130c] outline-none placeholder:text-[#9aa69d]'
                        placeholder='例如：基地靠近居住区和小学，现状缺少遮阴和儿童活动空间。'
                      />
                    </label>
                  </div>
                </SectionShell>

                <SectionShell className='p-5'>
                  <div className='mb-4'>
                    <div className='flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                      <SparklesIcon className='h-4 w-4 text-[#2f9e44]' />
                      输入 2 · 问题与期望输出
                    </div>
                    <p className='mt-1 text-[12px] leading-5 text-[#6f7d75]'>再选择你希望系统从哪些角度帮你推进，并说明现在卡在哪里。</p>
                  </div>

                  <div className='mb-3 text-[12px] font-semibold text-[#53605a]'>需要重点辅助什么？</div>
                  <div className='flex flex-wrap gap-2.5'>
                    {focusOptions.map((option) => {
                      const selected = form.focuses.includes(option)
                      return (
                        <button
                          key={option}
                          type='button'
                          onClick={() => toggleFocus(option)}
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

                  <div className='mt-5'>
                    <div className='text-[12px] font-semibold text-[#53605a]'>希望页面输出什么？</div>
                    <div className='mt-2 flex flex-wrap gap-2.5'>
                      {outputOptions.map((option) => {
                        const selected = form.outputNeeds.includes(option)
                        return (
                          <button
                            key={option}
                            type='button'
                            onClick={() => toggleOutputNeed(option)}
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
                  </div>

                  <label className='mt-5 block text-[12px] text-[#53605a]'>
                    具体问题 / 老师反馈 / 当前卡点
                    <textarea
                      value={form.question}
                      onChange={event => setForm(current => ({ ...current, question: event.target.value }))}
                      className='mt-2 min-h-[120px] w-full resize-none rounded-[14px] border border-[#dfe7dc] bg-[#fbfdfb] px-3 py-3 text-[13px] leading-6 text-[#06130c] outline-none placeholder:text-[#9aa69d]'
                      placeholder='例如：我想把社区公园做得更适合老人和儿童，需要找相关案例，并知道应该对应哪些绿地规范。'
                    />
                  </label>

                  <div className='mt-5 flex justify-end'>
                    <button
                      type='button'
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className='rounded-full bg-[#2f9e44] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_30px_-22px_rgba(47,158,68,0.68)] transition hover:bg-[#288a3d] disabled:cursor-not-allowed disabled:bg-[#a9c9aa] disabled:shadow-none'
                    >
                      {isGenerating ? '生成中...' : rawAnswer ? '重新匹配案例与规范' : '匹配案例与规范'}
                    </button>
                  </div>
                </SectionShell>
              </div>

              <div className='space-y-5'>
                <SectionShell className='p-5'>
                  <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                    <ClipboardDocumentCheckIcon className='h-4 w-4 text-[#2f9e44]' />
                    页面输出链条
                  </div>
                  <div className='mb-4 rounded-[14px] bg-[#f7faf6] px-4 py-3 text-[12px] leading-5 text-[#53605a]'>
                    用户问题 {'->'} 匹配案例 {'->'} 案例关键词 {'->'} 相关规范 {'->'} 输出案例介绍和规范名称
                  </div>
                  <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-2'} grid gap-3`}>
                    {outputGuide.map(item => (
                      <div
                        key={item.title}
                        className={`rounded-[14px] border px-4 py-3 ${
                          form.outputNeeds.includes(item.title)
                            ? 'border-[#b8d9b8] bg-[#f7faf6]'
                            : 'border-[#e5ece2] bg-white'
                        }`}
                      >
                        <div className='text-[13px] font-semibold text-[#06130c]'>{item.title}</div>
                        <p className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell className='p-5'>
                  <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                    <BookOpenIcon className='h-4 w-4 text-[#2f9e44]' />
                    匹配课程案例与规范
                  </div>
                  {!!visibleCaseKeywords.length && (
                    <div className='mb-4 rounded-[14px] bg-[#f7faf6] px-3 py-3'>
                      <div className='mb-2 text-[12px] font-semibold text-[#06130c]'>从案例提取的规范检索关键词</div>
                      <div className='flex flex-wrap gap-1.5'>
                        {visibleCaseKeywords.map(keyword => (
                          <span key={keyword} className='rounded-full bg-white px-2.5 py-1 text-[11px] text-[#2f9e44] ring-1 ring-[#dfe7dc]'>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={`${isMobile ? 'grid-cols-1' : 'grid-cols-3'} grid gap-3`}>
                    {matchedCases.map(item => (
                      <div key={item.id} className='rounded-[14px] border border-[#e5ece2] bg-[#fbfdfb] p-4'>
                        <div className='text-[14px] font-semibold leading-5 text-[#06130c]'>{item.caseName}</div>
                        <div className='mt-2 text-[11px] font-semibold text-[#2f9e44]'>{item.projectType}</div>
                        <p className='mt-3 line-clamp-4 text-[12px] leading-5 text-[#53605a]'>{item.description}</p>
                        <div className='mt-3 flex flex-wrap gap-1.5'>
                          {item.strategies.slice(0, 3).map(strategy => (
                            <span key={strategy} className='rounded-full bg-[#eef3ec] px-2 py-1 text-[11px] text-[#53605a]'>{strategy}</span>
                          ))}
                        </div>
                        <div className='mt-3 border-t border-[#e5ece2] pt-3'>
                          <div className='text-[11px] font-semibold text-[#8a947f]'>关联规范</div>
                          <div className='mt-2 flex flex-wrap gap-1.5'>
                            {item.relatedCodes.slice(0, 3).map(code => (
                              <span key={code} className='rounded-full bg-white px-2 py-1 text-[11px] text-[#53605a] ring-1 ring-[#dfe7dc]'>{code}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell className='p-5'>
                  <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                    <CheckCircleIcon className='h-4 w-4 text-[#2f9e44]' />
                    本次优先核查规范
                  </div>
                  <div className='space-y-2'>
                    {relevantSpecs.map(spec => (
                      <div key={`${spec.code}-${spec.name}`} className='rounded-[12px] border border-[#e5ece2] bg-[#fbfdfb] px-3 py-3'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='rounded-full bg-[#eef7ed] px-2 py-0.5 text-[11px] font-semibold text-[#2f9e44]'>{spec.category}</span>
                          <span className='text-[12px] font-semibold text-[#06130c]'>{spec.name}</span>
                          <span className='text-[11px] text-[#6f7d75]'>{spec.code}</span>
                        </div>
                        <p className='mt-2 text-[12px] leading-5 text-[#53605a]'>{spec.useFor}</p>
                      </div>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell className='min-h-[360px] p-5'>
                  <div className='mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#06130c]'>
                    <CheckCircleIcon className='h-4 w-4 text-[#2f9e44]' />
                    案例辅助结果
                  </div>

                  {isGenerating && (
                    <div className='flex min-h-[260px] items-center justify-center text-center'>
                      <div>
                        <div className='text-[14px] font-semibold text-[#06130c]'>正在结合课程案例生成建议...</div>
                        <div className='mt-2 text-[12px] text-[#53605a]'>会优先回答案例怎么用，以及哪些地方不能照搬。</div>
                      </div>
                    </div>
                  )}

                  {!isGenerating && !rawAnswer && (
                    <div className='flex min-h-[260px] items-center justify-center text-center'>
                      <div>
                        <div className='text-[14px] font-semibold text-[#06130c]'>等待生成项目推进方案</div>
                        <div className='mt-2 text-[12px] leading-5 text-[#53605a]'>填写左侧输入后，系统会按你选择的输出类型生成案例方法、规范核查和下一步成果清单。</div>
                      </div>
                    </div>
                  )}

                  {!isGenerating && rawAnswer && !effectiveParsedResult && (
                    <div className='max-h-[360px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-6 text-[#06130c]'>
                      {rawAnswer}
                    </div>
                  )}

                  {!isGenerating && effectiveParsedResult && (
                    <div className='space-y-5'>
                      {effectiveParsedResult.project_judgement && (
                        <div className='rounded-[14px] bg-[#f7faf6] px-4 py-3 text-[13px] leading-6 text-[#53605a]'>
                          <span className='font-semibold text-[#06130c]'>项目判断：</span>
                          {effectiveParsedResult.project_judgement}
                        </div>
                      )}

                      {effectiveParsedResult.regulatory_framework && (
                        <div className='rounded-[14px] border border-[#dfe7dc] bg-white px-4 py-3 text-[13px] leading-6 text-[#53605a]'>
                          <span className='font-semibold text-[#06130c]'>规范框架：</span>
                          {effectiveParsedResult.regulatory_framework}
                        </div>
                      )}

                      {effectiveParsedResult.project_progress_plan && (
                        <div className='rounded-[14px] border border-[#cfe5cc] bg-[#f7faf6] px-4 py-3 text-[13px] leading-6 text-[#53605a]'>
                          <span className='font-semibold text-[#06130c]'>推进判断：</span>
                          {effectiveParsedResult.project_progress_plan}
                        </div>
                      )}

                      {effectiveParsedResult.overall_judgement && (
                        <div className='rounded-[14px] border border-[#cfe5cc] bg-[#f7faf6] px-4 py-3 text-[13px] leading-6 text-[#53605a]'>
                          <span className='font-semibold text-[#06130c]'>总体判断：</span>
                          {effectiveParsedResult.overall_judgement}
                        </div>
                      )}

                      {!!effectiveParsedResult.user_keywords?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>用户问题关键词</div>
                          <div className='flex flex-wrap gap-2'>
                            {effectiveParsedResult.user_keywords.map(keyword => (
                              <span key={keyword} className='rounded-full bg-[#eef7ed] px-3 py-1.5 text-[12px] font-medium text-[#2f9e44]'>{keyword}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.case_keywords?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>案例关键词</div>
                          <div className='flex flex-wrap gap-2'>
                            {effectiveParsedResult.case_keywords.map(keyword => (
                              <span key={keyword} className='rounded-full bg-[#f7faf6] px-3 py-1.5 text-[12px] font-medium text-[#2f9e44] ring-1 ring-[#dfe7dc]'>{keyword}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.related_norm_names?.length && (
                        <ResultList title='相关规范名称' items={effectiveParsedResult.related_norm_names} />
                      )}

                      {!!effectiveParsedResult.case_suggestions?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>逐案例项目建议</div>
                          <div className='space-y-3'>
                            {effectiveParsedResult.case_suggestions.map((item, index) => (
                              <div key={`${item.case_title}-${index}`} className='rounded-[14px] border border-[#e5ece2] bg-white p-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <div className='text-[14px] font-semibold text-[#06130c]'>{item.case_title || `案例 ${index + 1}`}</div>
                                  {item.case_link && (
                                    <a
                                      href={item.case_link}
                                      target='_blank'
                                      rel='noreferrer'
                                      className='rounded-full bg-[#eef7ed] px-2 py-0.5 text-[11px] font-semibold text-[#2f9e44]'
                                    >
                                      来源链接
                                    </a>
                                  )}
                                </div>
                                {item.relevance && <p className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.relevance}</p>}
                                {!!item.methods?.length && (
                                  <div className='mt-3 space-y-2'>
                                    <div className='text-[12px] font-semibold text-[#06130c]'>可借鉴方法</div>
                                    {item.methods.map(method => (
                                      <div key={method} className='rounded-[12px] bg-[#fbfdfb] px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>{method}</div>
                                    ))}
                                  </div>
                                )}
                                {!!item.regulation_focus?.length && (
                                  <div className='mt-3'>
                                    <div className='mb-2 text-[12px] font-semibold text-[#06130c]'>规范关注点</div>
                                    <div className='flex flex-wrap gap-1.5'>
                                      {item.regulation_focus.map(focus => (
                                        <span key={focus} className='rounded-full bg-[#f7faf6] px-2.5 py-1 text-[11px] text-[#2f9e44] ring-1 ring-[#dfe7dc]'>{focus}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {!!item.project_suggestions?.length && (
                                  <div className='mt-3 space-y-2'>
                                    <div className='text-[12px] font-semibold text-[#06130c]'>给当前项目的建议</div>
                                    {item.project_suggestions.map(suggestion => (
                                      <div key={suggestion} className='rounded-[12px] bg-[#f7faf6] px-3 py-2 text-[12px] leading-5 text-[#53605a]'>{suggestion}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.borrow_methods?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>可借鉴方法</div>
                          <div className='space-y-3'>
                            {effectiveParsedResult.borrow_methods.map((item, index) => (
                              <div key={`${item.case_name}-${item.method}-${index}`} className='rounded-[14px] border border-[#e5ece2] bg-white p-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <div className='text-[14px] font-semibold text-[#06130c]'>{item.method || `方法 ${index + 1}`}</div>
                                  {item.case_name && <span className='rounded-full bg-[#eef7ed] px-2 py-0.5 text-[11px] font-semibold text-[#2f9e44]'>{item.case_name}</span>}
                                </div>
                                {item.how_to_apply && <p className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.how_to_apply}</p>}
                                {!!item.source_keywords?.length && (
                                  <div className='mt-3 flex flex-wrap gap-1.5'>
                                    {item.source_keywords.map(keyword => (
                                      <span key={keyword} className='rounded-full bg-[#f7faf6] px-2 py-1 text-[11px] text-[#53605a]'>{keyword}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.case_normative_links?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>案例信息与规范关注点</div>
                          <div className='overflow-hidden rounded-[14px] border border-[#e5ece2]'>
                            <div className={`${isMobile ? 'hidden' : 'grid'} grid-cols-[1.25fr_1fr_1fr] bg-[#f7faf6] text-[12px] font-semibold text-[#06130c]`}>
                              <div className='border-r border-[#e5ece2] px-3 py-2'>案例文字信息</div>
                              <div className='border-r border-[#e5ece2] px-3 py-2'>可关联的绿地规范关注点</div>
                              <div className='px-3 py-2'>可能对应规范方向</div>
                            </div>
                            <div className='divide-y divide-[#e5ece2]'>
                              {effectiveParsedResult.case_normative_links.map((item, index) => (
                                <div key={`${item.case_text_info}-${index}`} className={`${isMobile ? 'grid-cols-1' : 'grid-cols-[1.25fr_1fr_1fr]'} grid bg-white text-[12px] leading-5 text-[#53605a]`}>
                                  <div className={`${isMobile ? '' : 'border-r border-[#e5ece2]'} px-3 py-3`}>
                                    {isMobile && <div className='mb-1 font-semibold text-[#06130c]'>案例文字信息</div>}
                                    {item.case_text_info}
                                  </div>
                                  <div className={`${isMobile ? 'border-t border-[#eef3ec]' : 'border-r border-[#e5ece2]'} px-3 py-3`}>
                                    {isMobile && <div className='mb-1 font-semibold text-[#06130c]'>可关联的绿地规范关注点</div>}
                                    {item.green_space_focus}
                                  </div>
                                  <div className={`${isMobile ? 'border-t border-[#eef3ec]' : ''} px-3 py-3`}>
                                    {isMobile && <div className='mb-1 font-semibold text-[#06130c]'>可能对应规范方向</div>}
                                    {item.possible_spec_direction}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.case_introductions?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>案例介绍</div>
                          <div className='space-y-3'>
                            {effectiveParsedResult.case_introductions.map((item, index) => (
                              <div key={`${item.case_name}-${index}`} className='rounded-[14px] border border-[#e5ece2] bg-white p-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <div className='text-[14px] font-semibold text-[#06130c]'>{item.case_name || `案例 ${index + 1}`}</div>
                                  {item.project_type && <span className='rounded-full bg-[#eef7ed] px-2 py-0.5 text-[11px] font-semibold text-[#2f9e44]'>{item.project_type}</span>}
                                </div>
                                {item.introduction && <p className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.introduction}</p>}
                                {!!item.matched_keywords?.length && (
                                  <div className='mt-3 flex flex-wrap gap-1.5'>
                                    {item.matched_keywords.map(keyword => (
                                      <span key={keyword} className='rounded-full bg-[#f7faf6] px-2 py-1 text-[11px] text-[#53605a]'>{keyword}</span>
                                    ))}
                                  </div>
                                )}
                                {!!item.related_spec_names?.length && (
                                  <div className='mt-3 rounded-[12px] bg-[#fbfdfb] px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>
                                    <span className='font-semibold text-[#2f9e44]'>相关规范：</span>
                                    {item.related_spec_names.join('；')}
                                  </div>
                                )}
                                {item.why_relevant && <div className='mt-3 text-[12px] leading-5 text-[#53605a]'>匹配原因：{item.why_relevant}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.usage_notes?.length && (
                        <ResultList title='使用提醒' items={effectiveParsedResult.usage_notes} />
                      )}

                      {!!effectiveParsedResult.progress_suggestions?.length && (
                        <div>
                          <div className='mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#06130c]'>
                            <ClipboardDocumentCheckIcon className='h-4 w-4 text-[#2f9e44]' />
                            AI 项目推进建议
                          </div>
                          <div className='space-y-3'>
                            {effectiveParsedResult.progress_suggestions.map((item, index) => (
                              <div key={`${item.suggestion}-${index}`} className='rounded-[14px] border border-[#e5ece2] bg-white p-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <span className='rounded-full bg-[#2f9e44] px-2.5 py-1 text-[11px] font-semibold text-white'>{item.priority || `建议 ${index + 1}`}</span>
                                  {item.project_stage && <span className='text-[12px] font-semibold text-[#06130c]'>{item.project_stage}</span>}
                                </div>
                                {item.suggestion && <p className='mt-3 text-[13px] leading-6 text-[#06130c]'>{item.suggestion}</p>}
                                <div className='mt-3 grid gap-2'>
                                  {item.case_reference && (
                                    <div className='rounded-[12px] bg-[#fbfdfb] px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>
                                      <span className='font-semibold text-[#2f9e44]'>案例用法：</span>
                                      {item.case_reference}
                                    </div>
                                  )}
                                  {item.normative_check && (
                                    <div className='rounded-[12px] bg-[#fbfdfb] px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>
                                      <span className='font-semibold text-[#2f9e44]'>规范核查：</span>
                                      {item.normative_check}
                                    </div>
                                  )}
                                  {item.expected_output && (
                                    <div className='rounded-[12px] bg-[#fbfdfb] px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>
                                      <span className='font-semibold text-[#2f9e44]'>本轮产出：</span>
                                      {item.expected_output}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.matched_cases?.length && (
                        <div className='space-y-3'>
                          {effectiveParsedResult.matched_cases.map((item, index) => (
                            <div key={`${item.case_name}-${index}`} className='rounded-[14px] border border-[#e5ece2] bg-white p-4'>
                              <div className='text-[14px] font-semibold text-[#06130c]'>{item.case_name || `案例 ${index + 1}`}</div>
                              {item.relevance && <p className='mt-2 text-[12px] leading-5 text-[#53605a]'>{item.relevance}</p>}
                              {!!item.transferable_methods?.length && (
                                <div className='mt-3 space-y-2'>
                                  {item.transferable_methods.map(method => (
                                    <div key={method} className='rounded-[12px] bg-[#fbfdfb] px-3 py-2 text-[12px] leading-5 text-[#53605a] ring-1 ring-[#e5ece2]'>{method}</div>
                                  ))}
                                </div>
                              )}
                              {!!item.normative_basis?.length && (
                                <div className='mt-3 rounded-[12px] bg-[#f7faf6] px-3 py-3'>
                                  <div className='mb-2 text-[12px] font-semibold text-[#06130c]'>对应规范约束</div>
                                  <div className='space-y-2'>
                                    {item.normative_basis.map((basis, basisIndex) => (
                                      <div key={`${basis.spec_name}-${basisIndex}`} className='text-[12px] leading-5 text-[#53605a]'>
                                        <span className='font-semibold text-[#2f9e44]'>{basis.spec_name}</span>
                                        {basis.check_focus && <span> · {basis.check_focus}</span>}
                                        {basis.how_it_constrains_case && <div className='mt-1'>{basis.how_it_constrains_case}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {item.caution && <div className='mt-3 text-[12px] leading-5 text-[#8a6a2f]'>注意：{item.caution}</div>}
                            </div>
                          ))}
                        </div>
                      )}

                      {!!effectiveParsedResult.regulatory_checks?.length && (
                        <div>
                          <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>规范核查清单</div>
                          <div className='space-y-2'>
                            {effectiveParsedResult.regulatory_checks.map((item, index) => (
                              <div key={`${item.spec_name}-${index}`} className='rounded-[12px] border border-[#e5ece2] bg-[#fbfdfb] px-3 py-3 text-[12px] leading-5 text-[#53605a]'>
                                <div className='font-semibold text-[#06130c]'>{item.spec_name || `规范 ${index + 1}`}</div>
                                {item.check_item && <div className='mt-1 text-[#2f9e44]'>{item.check_item}</div>}
                                {item.why_it_matters && <div className='mt-1'>{item.why_it_matters}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!!effectiveParsedResult.design_actions?.length && (
                        <ResultList title='可直接推进的设计动作' items={effectiveParsedResult.design_actions} />
                      )}
                      {!!effectiveParsedResult.code_risks?.length && (
                        <ResultList title='需要同步核查的风险' items={effectiveParsedResult.code_risks} />
                      )}
                      {!!effectiveParsedResult.deliverable_checklist?.length && (
                        <ResultList title='本轮成果清单' items={effectiveParsedResult.deliverable_checklist} />
                      )}
                      {!!effectiveParsedResult.teacher_review_questions?.length && (
                        <ResultList title='下次和老师确认的问题' items={effectiveParsedResult.teacher_review_questions} />
                      )}
                      {!!effectiveParsedResult.next_steps?.length && (
                        <ResultList title='下一步建议' items={effectiveParsedResult.next_steps} />
                      )}
                    </div>
                  )}
                </SectionShell>
              </div>
            </div>
          )}
      </main>
    </div>
  )
}

const ResultList: FC<{ title: string, items: string[] }> = ({ title, items }) => (
  <div>
    <div className='mb-2 text-[13px] font-semibold text-[#06130c]'>{title}</div>
    <div className='space-y-2'>
      {items.map(item => (
        <div key={item} className='rounded-[12px] bg-[#f7faf6] px-3 py-2 text-[12px] leading-5 text-[#53605a]'>{item}</div>
      ))}
    </div>
  </div>
)

export default React.memo(ProjectAssistant)
