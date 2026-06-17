import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT_SITEMAP = 'https://mooool.com/wp-sitemap.xml'
const USER_AGENT = 'GreenBotCourseCaseIndexer/0.1 (public metadata only; no images; contact: coursework)'
const MISSING = '缺少相关信息'

const args = new Map(
  process.argv.slice(2).map((item) => {
    const [key, value = 'true'] = item.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

const limit = Number(args.get('limit') || 100)
const delayMs = Number(args.get('delay') || 5000)
const output = args.get('out') || path.resolve(process.cwd(), 'case-library', 'mooool-cases-100.md')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, '\'')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8216;/g, '\'')
    .replace(/&#8217;/g, '\'')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
}

function stripTags(html = '') {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function getMeta(html, property) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return decodeHtml(html.match(pattern)?.[1] || '').trim()
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.text()
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map(match => decodeHtml(match[1]).trim())
    .filter(Boolean)
}

function extractSitemapEntries(xml) {
  return [...xml.matchAll(/<url>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?(?:<lastmod>([\s\S]*?)<\/lastmod>)?[\s\S]*?<\/url>/gi)]
    .map(match => ({
      url: decodeHtml(match[1]).trim(),
      lastmod: decodeHtml(match[2] || '').trim(),
    }))
    .filter(item => item.url)
}

function cleanTitle(title) {
  return decodeHtml(title)
    .replace(/\s*[–-]\s*mooool.*$/i, '')
    .replace(/\s*_\s*mooool.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTitle(html) {
  const ogTitle = getMeta(html, 'og:title')
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const docTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return cleanTitle(stripTags(ogTitle || h1 || docTitle || '未命名案例'))
}

function extractTags(html) {
  const tagTexts = [
    ...html.matchAll(/rel=["']tag["'][^>]*>([\s\S]*?)<\/a>/gi),
    ...html.matchAll(/class=["'][^"']*(?:tag|cat)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi),
  ].map(match => stripTags(match[1])).filter(Boolean)

  return [...new Set(tagTexts)].slice(0, 12)
}

function extractCompany(title, text) {
  const titleMatch = title.match(/[｜|]\s*([^｜|/]+?)(?:\s*设计|\s*DESIGN|\s*Design)?\s*$/i)
  if (titleMatch?.[1]) {
    return titleMatch[1].trim()
  }

  const patterns = [
    /(?:景观设计|设计单位|设计公司|Design|Landscape Design|Designer)[:：]\s*([^。；;|｜\n]{2,80})/i,
    /(?:by|BY)\s+([^。；;|｜\n]{2,80})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].replace(/\s+/g, ' ').trim()
    }
  }

  return MISSING
}

function extractLocation(text) {
  const patterns = [
    /(?:项目地点|项目地址|地点|位置|Location|Project Location|Site)[:：]\s*([^。；;|｜\n]{2,60})/i,
    /(?:位于|坐落于|地处)([^。；;，,\n]{2,40})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].replace(/\s+/g, ' ').trim()
    }
  }

  const cityKeywords = ['上海', '北京', '广州', '深圳', '杭州', '成都', '重庆', '南京', '苏州', '武汉', '西安', '青岛', '宁波', '长沙', '郑州', '天津', '佛山', '厦门']
  const city = cityKeywords.find(item => text.includes(item))
  return city || MISSING
}

function inferProjectType(text, tags) {
  const source = `${tags.join(' ')} ${text}`
  const rules = [
    ['滨水绿地', ['滨水', '水岸', '河岸', '湖岸', '码头', '绿廊', '湿地']],
    ['社区公园', ['社区', '口袋公园', '邻里', '居住区', '住宅']],
    ['城市公园', ['公园', '开放空间', '公共绿地']],
    ['校园绿地', ['校园', '学校', '大学', '学院']],
    ['商业景观', ['商业', '街区', '综合体', '示范区', '售楼处']],
    ['城市更新绿地', ['更新', '改造', '工业遗址', '旧厂', '存量']],
    ['街道绿化', ['街道', '道路', '街区', '步行街']],
  ]

  return rules.find(([, keywords]) => keywords.some(keyword => source.includes(keyword)))?.[0] || MISSING
}

function extractArea(text) {
  const area = firstMatch(text, [
    /(?:景观面积|项目面积|占地面积|用地面积|面积|Landscape Area|Site Area|Area)[:：]?\s*([0-9][0-9,]*(?:\.[0-9]+)?\s*(?:㎡|m²|平方米|公顷|ha))/i,
    /([0-9][0-9,]*(?:\.[0-9]+)?\s*(?:㎡|m²|平方米|公顷|ha))/i,
  ])

  return area || MISSING
}

function inferSiteIssues(text) {
  const rules = [
    ['滨水可达性与岸线公共性不足', ['滨水', '水岸', '河岸', '亲水']],
    ['慢行系统连续性与节点停留需要组织', ['慢行', '步行', '骑行', '路径', '游线']],
    ['高差、竖向和边界关系需要精细处理', ['高差', '台地', '坡', '竖向', '边界']],
    ['儿童、老人和日常休憩活动需要兼容', ['儿童', '老人', '全龄', '亲子', '邻里']],
    ['硬质空间偏多，需要补充遮阴、绿量和生态缓冲', ['硬质', '铺装', '遮阴', '树荫', '绿量']],
    ['存量场地需要在保留记忆和功能更新之间取得平衡', ['更新', '改造', '保留', '遗址', '记忆']],
    ['雨洪、下凹绿地和水体生态需要协同', ['雨水', '海绵', '湿地', '水体', '生态']],
  ]

  return rules
    .filter(([, keywords]) => keywords.some(keyword => text.includes(keyword)))
    .map(([label]) => label)
    .slice(0, 4)
}

function inferStrategies(text) {
  const rules = [
    ['蓝绿连通', ['滨水', '水岸', '湿地', '生态']],
    ['慢行优先', ['慢行', '步行', '骑行', '游线']],
    ['全龄友好', ['儿童', '老人', '全龄', '亲子']],
    ['可停留边界', ['座椅', '停留', '看护', '邻里']],
    ['遮阴休憩', ['遮阴', '树荫', '林下', '休憩']],
    ['海绵雨洪', ['雨水', '下凹', '海绵', '滞留']],
    ['场地记忆转译', ['保留', '遗址', '工业', '记忆']],
    ['复合活动节点', ['活动', '广场', '草坪', '平台']],
    ['低维护植物配置', ['乡土', '自然', '植物', '花境']],
  ]

  return rules
    .filter(([, keywords]) => keywords.some(keyword => text.includes(keyword)))
    .map(([label]) => label)
    .slice(0, 5)
}

function inferMethods(projectType, issues, strategies) {
  const methods = []

  if (strategies.includes('蓝绿连通')) {
    methods.push('把水体、岸线绿带、慢行路径和停留节点作为一个连续系统处理，而不是只做单点景观。')
  }
  if (strategies.includes('慢行优先')) {
    methods.push('先区分主通行线、支路和节点停留区，再用铺装、植物和视线组织空间节奏。')
  }
  if (strategies.includes('全龄友好')) {
    methods.push('将儿童活动、老人休憩和看护视线组织在相邻但不互相干扰的位置。')
  }
  if (strategies.includes('可停留边界')) {
    methods.push('利用树池、花池、台阶和座椅形成可停留边界，提高公共空间的日常使用率。')
  }
  if (strategies.includes('海绵雨洪')) {
    methods.push('把雨水花园、下凹绿地或生态草沟转化为可被讲清楚的设计逻辑，而不是只作为工程附属。')
  }
  if (strategies.includes('场地记忆转译')) {
    methods.push('保留可识别的场地痕迹，并转译为路径、展廊、活动棚架或展示节点。')
  }

  if (!methods.length) {
    methods.push(`将该案例作为${projectType}的空间组织参考，重点提炼“场地问题-设计策略-节点落位”的对应关系。`)
  }

  if (issues.length) {
    methods.push(`汇报时可把问题归纳为：${issues.slice(0, 2).join('；')}，再对应说明设计动作。`)
  }

  return methods.slice(0, 5)
}

function inferSpecs(projectType, text) {
  const specs = new Set(['城市绿地规划标准 GB/T 51346-2019', '城市绿地设计规范 GB 50420-2007（2016年版）'])

  if (projectType.includes('公园') || text.includes('公园')) {
    specs.add('公园设计规范 GB 51192-2016')
  }
  if (projectType.includes('社区') || text.includes('居住') || text.includes('儿童') || text.includes('老人')) {
    specs.add('城市居住区规划设计标准 GB 50180-2018')
    specs.add('无障碍设计规范 GB 50763-2012')
  }
  if (projectType.includes('滨水') || text.includes('慢行') || text.includes('绿道')) {
    specs.add('城镇绿道工程技术标准 CJJ/T 304-2019')
  }
  if (projectType.includes('街道') || text.includes('道路')) {
    specs.add('城市道路绿化设计标准 CJJ/T 75-2023')
  }
  if (text.includes('上海')) {
    specs.add('上海市绿地设计规范 DG/TJ 08-15')
  }
  if (text.includes('工程') || text.includes('种植') || text.includes('养护')) {
    specs.add('园林绿化工程项目规范 GB 55014-2021')
  }

  return [...specs].slice(0, 6)
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].replace(/\s+/g, ' ').trim()
    }
  }

  return ''
}

function includesAny(text, keywords) {
  return keywords.some(keyword => text.includes(keyword))
}

function buildNormativeLinks({ text, location, projectType, strategies, applicableSpecs }) {
  const links = []
  const pushUnique = (caseTextInfo, greenSpaceFocus, possibleSpecDirection) => {
    if (links.some(item => item.caseTextInfo === caseTextInfo)) {
      return
    }

    links.push({
      caseTextInfo,
      greenSpaceFocus,
      possibleSpecDirection,
    })
  }

  if (location && location !== MISSING) {
    pushUnique(
      `项目位于${location}，可作为${projectType}的地域与场地背景信息。`,
      '城市绿地系统衔接、地方绿地控制、项目服务对象与周边公共空间关系。',
      applicableSpecs.filter(item => item.includes('城市绿地规划标准') || item.includes('上海') || item.includes('绿化条例')).join('；') || '城市绿地规划标准、地方绿地设计规范',
    )
  }

  if (includesAny(text, ['滨水', '水岸', '河岸', '河道', '湖岸', '亲水', '滨河'])) {
    pushUnique(
      '案例涉及滨水或河岸界面，需要把岸线绿带、亲水节点、慢行路径和生态缓冲作为连续空间理解。',
      '滨水绿地、河道绿带、生态绿廊、亲水空间可达性与安全边界。',
      '城市绿地规划标准；城市绿地设计规范；城镇绿道工程技术标准；地方绿地设计规范',
    )
  }

  const heightDiff = firstMatch(text, [/([0-9]+(?:\.[0-9]+)?\s*(?:m|米))[^。；;]{0,18}(?:高差|落差)/i, /(?:高差|落差)[^。；;]{0,18}([0-9]+(?:\.[0-9]+)?\s*(?:m|米))/i])
  if (heightDiff || includesAny(text, ['高差', '竖向', '缓坡', '台地', '坡地'])) {
    pushUnique(
      `案例包含${heightDiff || '场地高差、缓坡或台地'}等竖向处理线索，需要关注不同标高之间的连续衔接。`,
      '竖向设计、无障碍衔接、坡地安全、滨水空间可达性与边界处理。',
      '城市绿地设计规范；无障碍设计规范；地方绿地设计规范',
    )
  }

  if (includesAny(text, ['保留', '现状', '原生', '香樟', '林带', '大树', '古树'])) {
    pushUnique(
      '案例提到现状植被、原生肌理或保留林带，可作为现状生态基底延续的检索线索。',
      '现状植被保护、树木保护、滨水生态基底延续、低干扰更新。',
      '园林绿化工程项目规范；城市绿地设计规范；地方绿化条例',
    )
  }

  if (includesAny(text, ['慢行', '漫游', '步行', '骑行', '游线', '园路'])) {
    pushUnique(
      '案例强调慢行、漫游或游线组织，可用于分析人行路径与公共节点之间的关系。',
      '慢行系统、园路连续性、步行体验、游憩流线和节点组织。',
      '公园设计规范；城镇绿道工程技术标准；城市道路绿化设计标准',
    )
  }

  if (includesAny(text, ['入口', '分区', '街区', '落客', '商业街', '节点', '序列'])) {
    pushUnique(
      '案例包含入口、落客、街区或节点序列等空间组织信息，可转化为功能分区和公共活动节点分析。',
      '功能分区、公共活动节点、入口导向、人流组织和空间序列。',
      '公园设计规范；城市绿地设计规范；无障碍设计规范',
    )
  }

  if (includesAny(text, ['花境', '自然式', '组团', '植物', '灌木', '草坪', '乔木', '季相'])) {
    pushUnique(
      `案例出现${strategies.includes('低维护植物配置') ? '低维护植物配置、' : ''}自然式组团、花境或草坪等植物设计线索。`,
      '植物配置、景观层次、季相变化、生态性、维护强度和视线通透。',
      '城市绿地设计规范；园林绿化工程项目规范；公园设计规范',
    )
  }

  const shrubHeight = firstMatch(text, [/([0-9]+(?:\.[0-9]+)?\s*[-~—至]\s*[0-9]+(?:\.[0-9]+)?\s*(?:m|米))[^。；;]{0,18}(?:灌|丛花|植物|高度)/i, /(?:灌|丛花|植物|高度)[^。；;]{0,18}([0-9]+(?:\.[0-9]+)?\s*[-~—至]\s*[0-9]+(?:\.[0-9]+)?\s*(?:m|米))/i])
  if (shrubHeight) {
    pushUnique(
      `案例中植物高度控制出现 ${shrubHeight} 这类尺度信息，可用于判断空间分隔和视线通透关系。`,
      '植物高度、视线安全、空间软分隔、儿童或人流活动安全。',
      '公园设计规范；城市绿地设计规范',
    )
  }

  if (includesAny(text, ['水景', '喷泉', '涌泉', '漫流', '跌水', '浅水'])) {
    pushUnique(
      '案例涉及水景、喷泉、涌泉或浅水界面，需要把景观体验和安全维护一起判断。',
      '景观水体安全、浅水设计、铺装防滑、排水组织、防触电和维护管理。',
      '公园设计规范；城市绿地设计规范；园林绿化工程项目规范',
    )
  }

  if (includesAny(text, ['座凳', '座椅', '外摆', '平台', '木座', '休憩'])) {
    pushUnique(
      '案例包含座凳、外摆、平台或休憩节点，可用于分析公共停留空间与通行边界。',
      '休憩设施配置、公共活动空间、商业外摆边界、无障碍通行净宽。',
      '公园设计规范；无障碍设计规范；城市道路绿化设计标准',
    )
  }

  if (includesAny(text, ['露营', '活动草坪', '草坪活动', '滨河休闲'])) {
    pushUnique(
      '案例出现草坪露营、活动草坪或滨河休闲等开放活动内容，需要关注承载与管理。',
      '草坪活动承载、开放活动空间、安全管理、维护强度和游憩设施组织。',
      '公园设计规范；城市绿地设计规范；园林绿化工程项目规范',
    )
  }

  if (includesAny(text, ['高架', '桥下', '净空', '噪声', '压迫'])) {
    pushUnique(
      '案例涉及高架、桥下或净空压迫界面，需要把道路基础设施边界转化为景观缓冲问题。',
      '道路界面、高架下空间利用、噪声缓冲、视线缓冲、安全防护和绿化隔离。',
      '城市道路绿化设计标准；城市绿地设计规范；地方街道设计导则',
    )
  }

  if (includesAny(text, ['人流', '导入', '导向', '入口', '可达'])) {
    pushUnique(
      '案例提到人流导入、入口导向或可达性，可作为公共空间组织和无障碍连续性的线索。',
      '人行流线、入口导向、公共空间可达性、连续通行和安全疏导。',
      '无障碍设计规范；公园设计规范；城市道路绿化设计标准',
    )
  }

  const area = firstMatch(text, [/([0-9][0-9,]*(?:\.[0-9]+)?\s*(?:㎡|m²|平方米))/i])
  if (area) {
    pushUnique(
      `案例景观或场地面积信息约为 ${area}，可作为后续指标核算和空间承载判断的基础。`,
      '绿地率、铺装率、活动场地占比、设施配置规模和开放空间承载。',
      '城市绿地规划标准；公园设计规范；城市绿地设计规范',
    )
  }

  if (!links.length) {
    pushUnique(
      `该案例可作为${projectType}的案例索引，需要进一步结合原页面核对场地、功能和设计策略细节。`,
      '项目类型识别、案例关键词提取、规范检索入口。',
      '城市绿地规划标准；城市绿地设计规范',
    )
  }

  return links.slice(0, 12)
}

function buildSummary(projectType, issues, strategies) {
  const issueText = issues.length ? issues.slice(0, 2).join('、') : '场地条件与公共使用需求'
  const strategyText = strategies.length ? strategies.slice(0, 3).join('、') : '空间组织、活动植入和绿化提升'

  return `该案例可作为${projectType}的设计参考，重点关注${issueText}，并通过${strategyText}等方式把场地问题转化为可落地的空间策略。`
}

function parseCase(url, html, lastmod) {
  const title = extractTitle(html)
  const text = stripTags(html)
  const tags = extractTags(html)
  const projectType = inferProjectType(text, tags)
  const siteIssues = inferSiteIssues(text)
  const strategies = inferStrategies(text)
  const methods = inferMethods(projectType, siteIssues, strategies)
  const specs = inferSpecs(projectType, text)
  const location = extractLocation(text)
  const area = extractArea(text)
  const publishedAt = getMeta(html, 'article:published_time')
    || html.match(/datetime=["']([^"']+)["']/i)?.[1]
    || lastmod
    || '未提取'

  return {
    title,
    sourceUrl: url,
    location,
    designCompany: extractCompany(title, text),
    projectType,
    area,
    tags,
    publishedAt: publishedAt.slice(0, 10),
    summary: buildSummary(projectType, siteIssues, strategies),
    siteIssues: siteIssues.length ? siteIssues : ['需要结合原案例进一步核对场地条件，避免脱离基地直接套用形式。'],
    strategies: strategies.length ? strategies : ['空间组织', '活动节点', '植物与公共界面优化'],
    transferableMethods: methods,
    applicableSpecs: specs,
    normativeLinks: buildNormativeLinks({
      text,
      location,
      projectType,
      strategies,
      applicableSpecs: specs,
    }),
  }
}

function mdCell(value = '') {
  return String(value).replace(/\|/g, '｜').replace(/\n+/g, ' ').trim()
}

function renderMarkdown(cases) {
  const generatedAt = new Date().toISOString()
  const lines = [
    '# mooool 公开案例索引（GreenBot 自写摘要版）',
    '',
    `生成时间：${generatedAt}`,
    '',
    '采集边界：只读取公开案例页；不登录；不进入后台；不下载图片；不保存正文原文；仅保存基础事实、来源链接和面向课程作业的自写归纳。',
    '',
  ]

  cases.forEach((item, index) => {
    lines.push(
      `## ${index + 1}. ${item.title}`,
      '',
      `- 标题：${item.title}`,
      `- 来源链接：${item.sourceUrl}`,
      `- 项目地点：${item.location}`,
      `- 设计公司：${item.designCompany}`,
      `- 项目类型：${item.projectType}`,
      `- 面积：${item.area}`,
      `- 自写摘要：${item.summary}`,
      `- 场地问题：${item.siteIssues.join('；')}`,
      `- 设计策略：${item.strategies.join('；')}`,
      '',
    )
  })

  return `${lines.join('\n')}\n`
}

async function collectPostUrls() {
  const rootXml = await fetchText(ROOT_SITEMAP)
  const sitemapUrls = extractLocs(rootXml).filter(url => /wp-sitemap-posts-post-\d+\.xml$/i.test(url))

  if (!sitemapUrls.length) {
    throw new Error('没有在 wp-sitemap.xml 中找到文章 sitemap。')
  }

  const entries = []

  for (const sitemapUrl of sitemapUrls) {
    console.log(`读取文章 sitemap: ${sitemapUrl}`)
    const xml = await fetchText(sitemapUrl)
    entries.push(...extractSitemapEntries(xml))
    if (entries.length >= limit) {
      break
    }
    await sleep(delayMs)
  }

  return entries
    .filter(item => item.url.startsWith('https://mooool.com/'))
    .filter(item => !item.url.includes('/wp-admin/') && !item.url.includes('/wp-login.php'))
    .slice(0, limit)
}

async function main() {
  console.log(`开始采集 mooool 公开案例索引，目标 ${limit} 条，间隔 ${delayMs}ms。`)
  const entries = await collectPostUrls()
  const cases = []

  for (const [index, entry] of entries.entries()) {
    try {
      console.log(`[${index + 1}/${entries.length}] ${entry.url}`)
      const html = await fetchText(entry.url)
      cases.push(parseCase(entry.url, html, entry.lastmod))
    }
    catch (error) {
      console.warn(`跳过：${entry.url}，原因：${error.message}`)
    }

    if (index < entries.length - 1) {
      await sleep(delayMs)
    }
  }

  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, renderMarkdown(cases), 'utf8')
  console.log(`完成：${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
