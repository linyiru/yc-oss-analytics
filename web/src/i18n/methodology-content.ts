// Localized Methodology content. Pure prose (no data tokens). English is the source of truth;
// other locales override. Markup understood by the renderer: **bold**, [text](url), `mono`.
import { type Locale } from './ui';
import jaRaw from './methodology.ja.json';
import koRaw from './methodology.ko.json';
import ptRaw from './methodology.pt.json';

export interface MDContent {
  eyebrow: string; h1: string; intro: string;
  defsTitle: string; defsSub: string;
  limitsTitle: string; limitsSub: string;
  starTitle: string; starSub: string; starBody: string;
  sourcesTitle: string; sourcesSub: string; sourcesBody: string;
  defs: [string, string][];
  limits: string[];
}

const en: MDContent = {
  eyebrow: 'Methodology',
  h1: 'How every number is made — and where it breaks.',
  intro: 'Independent analysis of public data on ~163 Y Combinator open-source companies. **Not affiliated with or endorsed by Y Combinator.** Every figure is an approximation with known caveats — we would rather under-claim.',
  defsTitle: 'How each metric is computed', defsSub: 'Definitions & the assumptions baked in',
  limitsTitle: 'Limitations', limitsSub: 'Read these before drawing conclusions',
  starTitle: 'Reading the star-growth story', starSub: 'The shape and sources of growth — descriptive, not a verdict',
  starBody: "We're curious about **how** a project's stars accumulated, not whether they're \"real\". A curve's shape usually points to one of a few all-legitimate paths: **steady organic growth**, an **event-driven spike** (a YC Launch, Show HN, Product Hunt, an HN front page, a well-timed tweet), or **alumni / network amplification** (early stars from the YC orbit). Engagement ratios (stars-per-fork, stars-per-contributor) are shown with peer context as descriptive lenses on that story — never accusations. We do not publish personal data or label any project as fake.",
  sourcesTitle: 'Sources & updates', sourcesSub: 'Provenance',
  sourcesBody: "Company list & batches from the public YC directory via `yc-oss`. Repo metadata and languages from the GitHub API (authenticated, rate-limit-respecting). Star history and the cross-star network from `GH Archive` (BigQuery), keyed by each repo's stable numeric id. Launch context from the Hacker News (Algolia), Product Hunt and YC-Launch APIs. Commit cadence, punch cards and churn from each repo's git history (cloned, analyzed, discarded). Only de-identified aggregates are published — raw stargazer accounts are never committed. A scheduled job tracks companies appearing and disappearing upstream. If you'd like your project corrected or excluded, open an issue.",
  defs: [
    ['Liveness (0–100)', 'A heuristic, not a validated index: 0.55·recency + 0.45·log-scaled 90-day commit volume. Treat it as ordinal — good for sorting, not a precise grade.'],
    ['Type (Evergreen / Rising / Steady / Dormant)', 'Crosses liveness with YC batch age. Evergreen = old cohort still very active; Dormant = liveness < 30. Squash-merge teams can look quieter than they are.'],
    ['Commit punch card', "Counts by weekday × hour in the commit's own recorded timezone. CI, rebases, travel and misconfigured clocks distort this — read night/weekend patterns as suggestive, never forensic."],
    ['Star-growth curve', 'Daily cumulative stars, reconstructed from GH Archive WatchEvents (via BigQuery) keyed by each repo\'s stable numeric id — so a rename never breaks the history. Complete for 161 of 163 repos; a handful with pre-2015 origins show an anchored baseline and are flagged "partial".'],
    ['Launch moments', 'HN, Product Hunt and YC-Launch posts pinned to the star curve by date. HN from the Algolia API (points & comments), Product Hunt from its API (votes), YC from the public launches feed. They mark what plausibly drove a spike — not an exhaustive list, and proximity is not proof.'],
    ['Time to traction', 'Days from the first commit to 100 / 1,000 / 10,000 stars, and to the first public launch. Computed only where the curve starts near zero (full early history); launch dates that fall before the first commit — an artifact of forked or renamed history — are dropped.'],
    ['YC-network backing', 'Share of a repo\'s earliest stargazers (first 100, first 1,000, and all-time) who also star ≥2 OTHER YC open-source repos. The repo being viewed is excluded from that count, so the figure is not inflated by self-counting. Derived structurally from GH Archive cross-starring — de-identified, no logins are stored or published.'],
    ['Controlled association', 'For size-sensitive "with vs without" claims (HN, Product Hunt, issue responsiveness), an ordinary-least-squares regression of log(stars) on the signal plus log(repo age) and language. We report the multiplier net of age and language; all three remain statistically significant. It is still observational — it does not control for unobserved quality and is not a causal estimate.'],
    ['AI-assisted %', 'Share of commits carrying a Co-Authored-By: Claude trailer. A lower bound — it only catches tools that write the trailer, and only when authors keep it.'],
    ['AI tool detection', 'From config files in the tree (CLAUDE.md, .cursor/, AGENTS.md, …). AGENTS.md is a vendor-neutral convention (not Codex-specific); MCP is excluded as it is a protocol, not a tool.'],
    ['Churn', 'Lines added/deleted per month via git numstat — computed only for fully-cloned repos; lock and generated files are not yet excluded.'],
    ['Contributor identity', 'Email-based. One person with multiple emails counts as several contributors; shared/bot emails merge people. Counts are approximate.'],
    ['Company status / outcome', 'YC\'s own ycdc_status per company (Active / Acquired / Public / Inactive), read from its public company page and snapshotted with a timestamp. Lets us show the part of survivorship we can see — the Trends page charts the distribution.'],
  ],
  limits: [
    'Survivorship bias (now partly measured): we read each company\'s YC status, so the Trends page shows how many tracked companies were acquired, went public, or went inactive. But truly dead-and-delisted companies leave YC\'s directory entirely and stay invisible — so every "alive" impression is still inflated, and every Signals pattern is blind to teams that did the same things and failed.',
    'Stars measure attention, not a business. Stars ≠ adoption ≠ revenue ≠ retention; a public repo may also just be marketing for a closed-source product.',
    '"With vs without" comparisons are between groups that differ on everything, not only the one signal. Where repo size could confound, we report the age- and language-controlled association — but selection on unobserved quality is never fully ruled out.',
    'Small n per batch (and small n for some signals, e.g. only ~40 Product Hunt launches) — read multiples loosely and do not rank cohorts on means.',
    'Composite scores (liveness) are weighted heuristics, not measurements; once visible, any metric can be gamed (Goodhart).',
    'Everything here is cross-sectional and correlational. It generates hypotheses to investigate, not causal proof.',
  ],
};

const zhHant: MDContent = {
  eyebrow: 'Methodology',
  h1: '每個數字怎麼算出來的——以及它在哪裡會失準。',
  intro: '對約 163 家 Y Combinator 開源公司的公開資料所做的獨立分析。**與 Y Combinator 無任何關聯,也未經其背書。** 每個數字都是帶著已知限制的近似值——我們寧可說得保守一點。',
  defsTitle: '每個指標怎麼計算', defsSub: '定義,以及內建的假設',
  limitsTitle: '限制', limitsSub: '下結論之前請先讀這些',
  starTitle: '解讀 star 成長的故事', starSub: '成長的形狀與來源——是描述,不是判決',
  starBody: '我們好奇的是一個專案的 star 是**怎麼**累積起來的,而不是它們「是不是真的」。一條曲線的形狀,通常指向幾條都完全正當的路徑之一:**穩定的自然成長**、**事件驅動的尖峰**(一次 YC Launch、Show HN、Product Hunt、HN 首頁,或一則時機剛好的推文),或是**校友/網路放大**(來自 YC 軌道的早期星)。互動比率(stars-per-fork、stars-per-contributor)會搭配同儕脈絡呈現,當作觀看那個故事的描述性透鏡——絕不是指控。我們不發布個人資料,也不把任何專案標記為造假。',
  sourcesTitle: '來源與更新', sourcesSub: '資料溯源',
  sourcesBody: '公司清單與梯次來自公開的 YC 目錄(透過 `yc-oss`)。Repo metadata 與語言來自 GitHub API(已認證、尊重 rate limit)。Star 歷史與跨 star 網路來自 `GH Archive`(BigQuery),以每個 repo 穩定的數字 id 為鍵。發表脈絡來自 Hacker News(Algolia)、Product Hunt 與 YC-Launch 的 API。Commit 節奏、punch card 與 churn 來自每個 repo 的 git 歷史(clone、分析、丟棄)。我們只發布去識別化的聚合資料——原始的 star 帳號從不被 commit。一個排程工作會追蹤公司在上游的新增與消失。若你希望修正或排除你的專案,請開一個 issue。',
  defs: [
    ['Liveness(0–100)', '一個啟發式分數,不是經過驗證的指數:0.55·近期性 + 0.45·對數縮放的 90 天 commit 量。請當成順序量——適合排序,不是精確的評分。'],
    ['類型(Evergreen / Rising / Steady / Dormant)', '把 liveness 與 YC 梯次年齡交叉。Evergreen = 老梯次但仍非常活躍;Dormant = liveness < 30。用 squash-merge 的團隊看起來可能比實際安靜。'],
    ['Commit punch card', '依 commit 自身記錄的時區、按星期幾 × 小時計數。CI、rebase、出差與設定錯誤的時鐘都會扭曲它——夜間/週末的型態請當成提示,絕非鑑識。'],
    ['Star 成長曲線', '每日累積 star,從 GH Archive 的 WatchEvents(透過 BigQuery)重建,以每個 repo 穩定的數字 id 為鍵——所以改名永遠不會弄斷歷史。163 個 repo 裡有 162 個完整;少數源自 2015 年以前的會顯示一個錨定的基線,並標記為「partial」。'],
    ['Launch moments', '把 HN、Product Hunt 與 YC-Launch 的貼文依日期釘在 star 曲線上。HN 來自 Algolia API(分數與留言),Product Hunt 來自其 API(票數),YC 來自公開的 launches feed。它們標示出「可能」推動某個尖峰的東西——不是窮舉清單,而且時間相近不等於因果。'],
    ['Time to traction', '從第一個 commit 到 100 / 1,000 / 10,000 star、以及到第一次公開發表所經過的天數。只在曲線從接近零開始(有完整早期歷史)時計算;落在第一個 commit 之前的發表日期——fork 或改名歷史造成的假象——會被丟棄。'],
    ['YC-network backing', '一個 repo 最早的 star 者(前 100、前 1,000、以及全期)中,另外也 star 了「≥2 個其他」 YC 開源 repo 的比例。被檢視的這個 repo 本身被排除在計數之外,所以數字不會被自我計數灌水。從 GH Archive 的跨 star 結構推導——去識別化,不儲存也不發布任何 login。'],
    ['Controlled association', '對會受規模影響的「有 vs 沒有」宣稱(HN、Product Hunt、issue 回應度),用 log(stars) 對該訊號加上 log(repo 年齡)與語言做最小平方迴歸。我們回報的是扣除年齡與語言後的倍率;三者都仍然統計顯著。它仍然是觀察性的——沒有控制未觀測的品質,也不是因果估計。'],
    ['AI-assisted %', '帶有 Co-Authored-By: Claude trailer 的 commit 比例。是下限——只抓得到會寫這個 trailer 的工具,而且只在作者保留它時。'],
    ['AI 工具偵測', '來自檔案樹裡的設定檔(CLAUDE.md、.cursor/、AGENTS.md…)。AGENTS.md 是中立於廠商的慣例(不是 Codex 專屬);MCP 被排除,因為它是協定,不是工具。'],
    ['Churn', '透過 git numstat 計算每月新增/刪除的行數——只對完整 clone 的 repo 計算;lock 檔與產生的檔案尚未被排除。'],
    ['貢獻者身分', '以 email 為基礎。一個人用多個 email 會被算成多位貢獻者;共用/bot 的 email 會把人合併。計數是近似值。'],
    ['公司狀態 / 結局', 'YC 自己對每家公司的 ycdc_status(營運中 / 已被收購 / 已上市 / 已停業),讀自其公開公司頁並加上時間戳快照。讓我們能呈現「看得見的那部分倖存」——Trends 頁把分布畫成圖表。'],
  ],
  limits: [
    '倖存者偏誤(現在已部分可量測):我們讀取每家公司的 YC 狀態,所以 Trends 頁會顯示有多少被追蹤的公司已被收購、上市或停業。但真正死掉並下架的公司會完全離開 YC 目錄、仍然隱形——所以每一個「還活著」的印象仍被高估,每一條 Signals 模式也看不見那些做了同樣的事卻失敗的團隊。',
    'Star 衡量的是注意力,不是生意。Star ≠ 採用 ≠ 營收 ≠ 留存;一個公開 repo 也可能只是某個閉源產品的行銷。',
    '「有 vs 沒有」的比較,是在「什麼都不一樣」的兩群之間,而不只差那一個訊號。當規模可能造成干擾時,我們回報控制了年齡與語言後的關聯——但對未觀測品質的選擇偏誤永遠無法完全排除。',
    '每個梯次的 n 很小(某些訊號的 n 也很小,例如只有約 40 次 Product Hunt 發表)——倍率請寬鬆地讀,也別用平均值替梯次排名。',
    '複合分數(liveness)是加權的啟發式,不是量測;一旦可見,任何指標都會被操弄(Goodhart)。',
    '這裡的一切都是橫斷面的、相關性的。它產生「值得去調查的假說」,不是因果證明。',
  ],
};

const zhHans: MDContent = {
  eyebrow: 'Methodology',
  h1: '每个数字怎么算出来的——以及它在哪里会失准。',
  intro: '对约 163 家 Y Combinator 开源公司的公开数据所做的独立分析。**与 Y Combinator 无任何关联,也未经其背书。** 每个数字都是带着已知局限的近似值——我们宁可说得保守一点。',
  defsTitle: '每个指标怎么计算', defsSub: '定义,以及内建的假设',
  limitsTitle: '局限', limitsSub: '下结论之前请先读这些',
  starTitle: '解读 star 成长的故事', starSub: '成长的形状与来源——是描述,不是判决',
  starBody: '我们好奇的是一个项目的 star 是**怎么**累积起来的,而不是它们「是不是真的」。一条曲线的形状,通常指向几条都完全正当的路径之一:**稳定的自然成长**、**事件驱动的尖峰**(一次 YC Launch、Show HN、Product Hunt、HN 首页,或一条时机刚好的推文),或是**校友/网络放大**(来自 YC 轨道的早期星)。互动比率(stars-per-fork、stars-per-contributor)会搭配同侪语境呈现,当作观看那个故事的描述性透镜——绝不是指控。我们不发布个人数据,也不把任何项目标记为造假。',
  sourcesTitle: '来源与更新', sourcesSub: '数据溯源',
  sourcesBody: '公司清单与批次来自公开的 YC 目录(通过 `yc-oss`)。Repo metadata 与语言来自 GitHub API(已认证、尊重 rate limit)。Star 历史与跨 star 网络来自 `GH Archive`(BigQuery),以每个 repo 稳定的数字 id 为键。发布语境来自 Hacker News(Algolia)、Product Hunt 与 YC-Launch 的 API。Commit 节奏、punch card 与 churn 来自每个 repo 的 git 历史(clone、分析、丢弃)。我们只发布去标识化的聚合数据——原始的 star 账号从不被 commit。一个定时任务会追踪公司在上游的新增与消失。若你希望修正或排除你的项目,请开一个 issue。',
  defs: [
    ['Liveness(0–100)', '一个启发式分数,不是经过验证的指数:0.55·近期性 + 0.45·对数缩放的 90 天 commit 量。请当成顺序量——适合排序,不是精确的评分。'],
    ['类型(Evergreen / Rising / Steady / Dormant)', '把 liveness 与 YC 批次年龄交叉。Evergreen = 老批次但仍非常活跃;Dormant = liveness < 30。用 squash-merge 的团队看起来可能比实际安静。'],
    ['Commit punch card', '依 commit 自身记录的时区、按星期几 × 小时计数。CI、rebase、出差与设置错误的时钟都会扭曲它——夜间/周末的形态请当成提示,绝非取证。'],
    ['Star 成长曲线', '每日累积 star,从 GH Archive 的 WatchEvents(通过 BigQuery)重建,以每个 repo 稳定的数字 id 为键——所以改名永远不会弄断历史。163 个 repo 里有 162 个完整;少数源自 2015 年以前的会显示一个锚定的基线,并标记为「partial」。'],
    ['Launch moments', '把 HN、Product Hunt 与 YC-Launch 的帖子按日期钉在 star 曲线上。HN 来自 Algolia API(分数与评论),Product Hunt 来自其 API(票数),YC 来自公开的 launches feed。它们标示出「可能」推动某个尖峰的东西——不是穷举清单,而且时间相近不等于因果。'],
    ['Time to traction', '从第一个 commit 到 100 / 1,000 / 10,000 star、以及到第一次公开发布所经过的天数。只在曲线从接近零开始(有完整早期历史)时计算;落在第一个 commit 之前的发布日期——fork 或改名历史造成的假象——会被丢弃。'],
    ['YC-network backing', '一个 repo 最早的 star 者(前 100、前 1,000、以及全期)中,另外也 star 了「≥2 个其他」 YC 开源 repo 的比例。被检视的这个 repo 本身被排除在计数之外,所以数字不会被自我计数灌水。从 GH Archive 的跨 star 结构推导——去标识化,不存储也不发布任何 login。'],
    ['Controlled association', '对会受规模影响的「有 vs 没有」论断(HN、Product Hunt、issue 响应度),用 log(stars) 对该信号加上 log(repo 年龄)与语言做最小二乘回归。我们报告的是扣除年龄与语言后的倍率;三者都仍然统计显著。它仍然是观察性的——没有控制未观测的质量,也不是因果估计。'],
    ['AI-assisted %', '带有 Co-Authored-By: Claude trailer 的 commit 比例。是下限——只抓得到会写这个 trailer 的工具,而且只在作者保留它时。'],
    ['AI 工具检测', '来自文件树里的配置文件(CLAUDE.md、.cursor/、AGENTS.md…)。AGENTS.md 是中立于厂商的惯例(不是 Codex 专属);MCP 被排除,因为它是协议,不是工具。'],
    ['Churn', '通过 git numstat 计算每月新增/删除的行数——只对完整 clone 的 repo 计算;lock 文件与生成的文件尚未被排除。'],
    ['贡献者身份', '以 email 为基础。一个人用多个 email 会被算成多位贡献者;共用/bot 的 email 会把人合并。计数是近似值。'],
    ['公司状态 / 结局', 'YC 自己对每家公司的 ycdc_status(运营中 / 已被收购 / 已上市 / 已停业),读自其公开公司页并加上时间戳快照。让我们能呈现「看得见的那部分幸存」——Trends 页把分布画成图表。'],
  ],
  limits: [
    '幸存者偏差(现在已部分可量测):我们读取每家公司的 YC 状态,所以 Trends 页会显示有多少被追踪的公司已被收购、上市或停业。但真正死掉并下架的公司会完全离开 YC 目录、仍然隐形——所以每一个「还活着」的印象仍被高估,每一条 Signals 模式也看不见那些做了同样的事却失败的团队。',
    'Star 衡量的是注意力,不是生意。Star ≠ 采用 ≠ 营收 ≠ 留存;一个公开 repo 也可能只是某个闭源产品的营销。',
    '「有 vs 没有」的比较,是在「什么都不一样」的两群之间,而不只差那一个信号。当规模可能造成干扰时,我们报告控制了年龄与语言后的关联——但对未观测质量的选择偏差永远无法完全排除。',
    '每个批次的 n 很小(某些信号的 n 也很小,例如只有约 40 次 Product Hunt 发布)——倍率请宽松地读,也别用平均值给批次排名。',
    '复合分数(liveness)是加权的启发式,不是测量;一旦可见,任何指标都会被操纵(Goodhart)。',
    '这里的一切都是横截面的、相关性的。它产生「值得去调查的假说」,不是因果证明。',
  ],
};

export const MD: Record<Locale, MDContent> = {
  en, 'zh-Hant': zhHant, 'zh-Hans': zhHans,
  ja: jaRaw as MDContent, ko: koRaw as MDContent, pt: ptRaw as MDContent,
};
