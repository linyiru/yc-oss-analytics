// Hand-crafted i18n dictionaries. English is the source of truth.
// zh-Hant / zh-Hans fully translated; ja / ko / pt seeded with English (TODO: native review).
// Keep DATA out of here — only UI chrome + interpolated insight templates live here.

export const locales = ['en', 'zh-Hant', 'zh-Hans', 'ja', 'ko', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
};

const en = {
  'site.title': 'YC Open Source Analytics',
  'site.tagline': 'How Y Combinator open-source teams actually build — work intensity, tech stack, and workflow, from their commit logs.',
  'nav.home': 'Repos',
  'nav.about': 'Method',
  'home.heading': 'YC Open Source teams, decoded from their git history',
  'home.intro': 'Commit cadence, tech stack, and workflow signals for {count} open-source YC companies.',
  'home.scatter.title': 'Batch age × current activity',
  'home.scatter.desc': 'Each bubble is a repo. X = years since YC batch, Y = liveness now. Top-left = evergreen (old but still very active).',
  'home.table.repo': 'Repo',
  'home.table.batch': 'Batch',
  'home.table.stars': 'Stars',
  'home.table.commitsWk': 'Commits/wk',
  'home.table.liveness': 'Liveness',
  'home.table.class': 'Type',
  'class.evergreen': 'Evergreen',
  'class.rising': 'Rising',
  'class.steady': 'Steady',
  'class.dormant': 'Dormant',
  'repo.stars': 'Stars',
  'repo.commits': 'Commits',
  'repo.commitsPerWeek': 'Commits / week',
  'repo.contributors': 'Contributors',
  'repo.months': 'Months active',
  'repo.liveness': 'Liveness',
  'repo.weekend': 'Weekend %',
  'repo.section.activity': 'Activity & liveness',
  'repo.section.stars': 'Star growth',
  'repo.section.punchcard': 'Commit rhythm (punch card)',
  'repo.section.monthly': 'Commits per month',
  'repo.section.churn': 'Net code growth per month',
  'repo.section.stack': 'Tech stack',
  'repo.section.workflow': 'Workflow',
  'repo.section.contributors': 'Core contributors',
  'repo.punchcard.desc': "Author-local time · Mon–Sun × 24h · darker = more commits · weekend share {pct}%",
  'repo.churn.added': 'Added',
  'repo.churn.deleted': 'Deleted',
  'repo.stack.pkg': 'Package manager',
  'repo.stack.langs': 'Languages',
  'repo.stack.infra': 'Infra & tooling',
  'repo.workflow.conventional': 'Conventional commits',
  'repo.workflow.merge': 'PR-merge share',
  'repo.workflow.ai': 'Claude co-authored commits',
  'insight.viral': '+{gain} stars in {days} days',
  'insight.evergreen': '{age}y since batch, still {c90} commits in the last 90 days',
  'footer.method': 'Built from full git history + GitHub API. Star curves from stargazer timestamps. Unofficial.',
  'footer.source': 'Data: yc-oss · Analysis: this project',
} as const;

export type UIKey = keyof typeof en;

const zhHant: Partial<Record<UIKey, string>> = {
  'site.title': 'YC 開源數據分析',
  'site.tagline': 'YC 開源團隊到底怎麼開發 —— 從 commit log 看工作強度、技術棧與工作流程。',
  'nav.home': '專案',
  'nav.about': '方法',
  'home.heading': '從 git 歷史解構 YC 開源團隊',
  'home.intro': '{count} 個 YC 開源公司的 commit 節奏、技術棧與工作流程訊號。',
  'home.scatter.title': '梯次年資 × 當前活躍度',
  'home.scatter.desc': '每個泡泡是一個 repo。X = 距 YC 梯次幾年,Y = 現在的活躍度。左上 = 常青(老但至今高度活躍)。',
  'home.table.repo': '專案',
  'home.table.batch': '梯次',
  'home.table.stars': 'Stars',
  'home.table.commitsWk': '週 commit',
  'home.table.liveness': '活躍度',
  'home.table.class': '類型',
  'class.evergreen': '常青',
  'class.rising': '崛起',
  'class.steady': '穩定',
  'class.dormant': '沉寂',
  'repo.stars': 'Stars',
  'repo.commits': 'Commits',
  'repo.commitsPerWeek': '每週 commit',
  'repo.contributors': '貢獻者',
  'repo.months': '開發月數',
  'repo.liveness': '活躍度',
  'repo.weekend': '週末佔比',
  'repo.section.activity': '活躍度與生命力',
  'repo.section.stars': 'Star 成長',
  'repo.section.punchcard': 'Commit 節奏(punch card)',
  'repo.section.monthly': '每月 commit',
  'repo.section.churn': '每月程式碼淨增長',
  'repo.section.stack': '技術棧',
  'repo.section.workflow': '工作流程',
  'repo.section.contributors': '核心貢獻者',
  'repo.punchcard.desc': '作者本地時區 · 週一–週日 × 24 小時 · 越深 commit 越多 · 週末佔比 {pct}%',
  'repo.churn.added': '新增',
  'repo.churn.deleted': '刪除',
  'repo.stack.pkg': '套件管理器',
  'repo.stack.langs': '語言',
  'repo.stack.infra': '基礎設施與工具',
  'repo.workflow.conventional': 'Conventional commits',
  'repo.workflow.merge': 'PR merge 佔比',
  'repo.workflow.ai': 'Claude 協作 commit',
  'insight.viral': '{days} 天暴增 {gain} 顆星',
  'insight.evergreen': '出生 {age} 年,近 90 天仍有 {c90} 個 commit',
  'footer.method': '基於完整 git 歷史 + GitHub API。Star 曲線取自 stargazer 時間戳。非官方。',
  'footer.source': '資料:yc-oss · 分析:本專案',
};

const zhHans: Partial<Record<UIKey, string>> = {
  'site.title': 'YC 开源数据分析',
  'site.tagline': 'YC 开源团队究竟怎么开发 —— 从 commit log 看工作强度、技术栈与工作流程。',
  'nav.home': '项目',
  'nav.about': '方法',
  'home.heading': '从 git 历史解构 YC 开源团队',
  'home.intro': '{count} 个 YC 开源公司的 commit 节奏、技术栈与工作流程信号。',
  'home.scatter.title': '梯次年限 × 当前活跃度',
  'home.scatter.desc': '每个气泡是一个 repo。X = 距 YC 梯次几年,Y = 现在的活跃度。左上 = 常青(老但至今高度活跃)。',
  'home.table.repo': '项目',
  'home.table.batch': '梯次',
  'home.table.stars': 'Stars',
  'home.table.commitsWk': '周 commit',
  'home.table.liveness': '活跃度',
  'home.table.class': '类型',
  'class.evergreen': '常青',
  'class.rising': '崛起',
  'class.steady': '稳定',
  'class.dormant': '沉寂',
  'repo.commitsPerWeek': '每周 commit',
  'repo.contributors': '贡献者',
  'repo.months': '开发月数',
  'repo.liveness': '活跃度',
  'repo.weekend': '周末占比',
  'repo.section.activity': '活跃度与生命力',
  'repo.section.stars': 'Star 增长',
  'repo.section.punchcard': 'Commit 节奏(punch card)',
  'repo.section.monthly': '每月 commit',
  'repo.section.churn': '每月代码净增长',
  'repo.section.stack': '技术栈',
  'repo.section.workflow': '工作流程',
  'repo.section.contributors': '核心贡献者',
  'repo.punchcard.desc': '作者本地时区 · 周一–周日 × 24 小时 · 越深 commit 越多 · 周末占比 {pct}%',
  'repo.churn.added': '新增',
  'repo.churn.deleted': '删除',
  'repo.stack.pkg': '包管理器',
  'repo.stack.langs': '语言',
  'repo.stack.infra': '基础设施与工具',
  'repo.workflow.merge': 'PR merge 占比',
  'repo.workflow.ai': 'Claude 协作 commit',
  'insight.viral': '{days} 天暴增 {gain} 颗星',
  'insight.evergreen': '诞生 {age} 年,近 90 天仍有 {c90} 个 commit',
  'footer.method': '基于完整 git 历史 + GitHub API。Star 曲线取自 stargazer 时间戳。非官方。',
  'footer.source': '数据:yc-oss · 分析:本项目',
};

// ja / ko / pt: English fallback for prose (TODO native review). The YC-cohort term is
// translated now since "batch" is a false friend in every one of these languages —
// the precise word is cohort/intake, not processing-batch.
const ja: Partial<Record<UIKey, string>> = {
  'home.table.batch': '期', // YC's cohort, e.g. 2025年冬期 (not バッチ = processing batch)
  'class.evergreen': '常緑', 'class.rising': '成長中', 'class.steady': '安定', 'class.dormant': '休眠',
};
const ko: Partial<Record<UIKey, string>> = {
  'home.table.batch': '기수', // cohort number (not 배치 = processing batch)
  'class.evergreen': '상록', 'class.rising': '성장 중', 'class.steady': '안정', 'class.dormant': '휴면',
};
const pt: Partial<Record<UIKey, string>> = {
  'home.table.batch': 'Turma', // cohort/class (not Lote = processing batch)
  'class.evergreen': 'Perene', 'class.rising': 'Em ascensão', 'class.steady': 'Estável', 'class.dormant': 'Dormente',
};

const dicts: Record<Locale, Partial<Record<UIKey, string>>> = {
  en,
  'zh-Hant': zhHant,
  'zh-Hans': zhHans,
  ja,
  ko,
  pt,
};

export function t(locale: Locale, key: UIKey, vars?: Record<string, string | number>): string {
  let s = dicts[locale]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function fmtNum(locale: Locale, n: number): string {
  const intlLocale = locale === 'zh-Hant' ? 'zh-TW' : locale === 'zh-Hans' ? 'zh-CN' : locale;
  return new Intl.NumberFormat(intlLocale).format(n);
}
