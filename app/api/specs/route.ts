import { NextResponse } from 'next/server'
import { specFilePaths } from './spec-files'

export const dynamic = 'force-dynamic'

type SpecCategory = '国家标准' | '行业标准' | '地方标准'

interface SpecItem {
  id: string
  category: SpecCategory
  tag: '国标' | '行标' | '地标'
  title: string
  code: string
  publisher: string
  year: string
  fileUrl: string
}

const categoryTagMap: Record<SpecCategory, SpecItem['tag']> = {
  国家标准: '国标',
  行业标准: '行标',
  地方标准: '地标',
}

const categoryPublisherMap: Record<SpecCategory, string> = {
  国家标准: '国家标准',
  行业标准: '行业标准',
  地方标准: '地方标准',
}

const defaultSpecBaseUrl = 'https://specs-1430019296.cos.ap-shanghai.myqcloud.com'

const normalizeSpaces = (value: string) => value.replace(/\s+/g, ' ').trim()

const createId = (value: string) => encodeURIComponent(value).replace(/%/g, '').toLowerCase()

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

const encodePath = (value: string) => value.split('/').map(segment => encodeURIComponent(segment)).join('/')

const createFileUrl = (filePath: string) => {
  const baseUrl = trimSlashes(process.env.SPECS_BASE_URL || defaultSpecBaseUrl)
  const pathPrefix = trimSlashes(process.env.SPECS_PATH_PREFIX || '')
  const encodedPath = encodePath(pathPrefix ? `${pathPrefix}/${filePath}` : filePath)

  return `${baseUrl}/${encodedPath}`
}

const extractYear = (value: string) => {
  const match = value.match(/(?:19|20)\d{2}/)

  return match?.[0] || ''
}

const parseSpecName = (name: string, category: SpecCategory) => {
  const baseName = normalizeSpaces(name.replace(/\.pdf$/i, ''))
  const codeMatch = baseName.match(/^([A-Za-z_\s\u00A0-]+[A-Za-z]?\s*[\d-]+(?:\s*-\s*\d{2,4})?)/)
  const code = codeMatch ? normalizeSpaces(codeMatch[1].replace(/_/g, '/')) : ''
  const title = code ? normalizeSpaces(baseName.slice(codeMatch![0].length)) : baseName

  return {
    title: title || baseName,
    code,
    publisher: categoryPublisherMap[category],
    year: extractYear(baseName),
  }
}

export async function GET() {
  const specs: SpecItem[] = specFilePaths.map((filePath) => {
    const [category, fileName] = filePath.split('/') as [SpecCategory, string]
    const parsed = parseSpecName(fileName, category)

    return {
      id: createId(filePath),
      category,
      tag: categoryTagMap[category],
      fileUrl: createFileUrl(filePath),
      ...parsed,
    }
  })

  specs.sort((a, b) => {
    const yearDiff = Number(b.year || 0) - Number(a.year || 0)

    if (yearDiff !== 0) {
      return yearDiff
    }

    return a.title.localeCompare(b.title, 'zh-CN')
  })

  return NextResponse.json({ data: specs })
}
