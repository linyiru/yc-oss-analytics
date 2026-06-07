// Localized Playbook content. The DATA (numbers, stats, slugs) stays in lib/playbook.ts;
// only the prose is translated here, as templates with {token} placeholders that are filled
// from the `vars` object lib/playbook.ts exposes. English text lives in lib/playbook.ts itself
// (the baked source of truth); this file supplies the non-English overrides + UI chrome for all
// locales. Echo author/source/url are NOT translated (essay titles & names stay as-is).
import { type Locale } from './ui';
import jaRaw from './playbook.ja.json';
import koRaw from './playbook.ko.json';
import ptRaw from './playbook.pt.json';

// Replace {token} with vars[token]; leave unknown tokens visible for debugging.
export const fill = (s: string, v: Record<string, string | number>): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? String(v[k]) : `{${k}}`));

export interface EchoT { principle: string; author: string; source: string; url: string }
export interface LessonT {
  title: string; statLabel: string; kicker?: string;
  body: string[]; echoes: EchoT[]; caveat: string;
  compare?: { aLabel: string; bLabel: string };
}
export interface PBChrome { eyebrow: string; h1: string; lede: string; inPractice: string; echoesCanon: string; footAttention: string; footMethod: string }

// markup understood by the renderer: **bold**, [text](url), «highlighted»
export const PB_UI: Record<Locale, PBChrome> = {
  en: {
    eyebrow: 'The Playbook',
    h1: 'What we learned from {n} «open-source» startups.',
    lede: 'Patterns we noticed across the {n} YC open-source companies in this dataset — each tied to a number computed straight from public history, recomputed as the data updates. What struck us is how closely they echo the startup canon: the data keeps landing on the same advice Paul Graham and the [YC library](https://www.ycombinator.com/library) have given for years — so we have paired each finding with the essay it confirms. Still, these are **observations, not instructions**: correlations among teams that grew, not proof of cause, and blind to everyone who did the same things and did not make it.',
    inPractice: 'In practice',
    echoesCanon: 'Echoes the canon',
    footAttention: '**One honest caveat above all the others:** every number here measures **attention** — stars, launches, comments — not revenue, retention, or whether a business exists underneath. Stars are a leading indicator that people noticed, nothing more. A team could do all of these things, reach 10,000 stars, and still have no users who pay or stay. Read this as a map of how attention was won, never as a scoreboard for success.',
    footMethod: 'Every figure recomputes from the live dataset — stars, launch events, issue/PR activity and the cross-star network, all derived from public GitHub history plus the HN, Product Hunt and YC-Launch records and GH Archive. Where a finding could be confounded by repo size, we report the association after controlling for age and language. See [Methodology](/methodology) for limits — above all survivorship bias, which hides every team that did these same things and still did not make it.',
  },
  'zh-Hant': {
    eyebrow: 'The Playbook',
    h1: '我們從 {n} 家「«開源新創»」身上學到的事。',
    lede: '這是我們在資料中觀察到、{n} 家 YC 開源公司共有的模式——每一條都對應一個直接從公開歷史算出來、會隨資料更新重算的數字。最讓我們意外的是,它們和新創界的經典觀點高度呼應:數據一再落回 Paul Graham 與 [YC library](https://www.ycombinator.com/library) 講了多年的同一套建議——所以我們替每個發現都配上了它所印證的那篇文章。但請記得,這些是 **觀察,不是教條**:它們是成長中的團隊之間的相關性,不是因果證明,也看不見那些做了同樣的事卻沒成功的人。',
    inPractice: '實際案例',
    echoesCanon: '與經典呼應',
    footAttention: '**所有提醒裡最該記住的一條:** 這裡每個數字衡量的都是 **注意力**——星數、發表、留言——而不是營收、留存,或底下到底有沒有一門生意。星數只是「有人注意到了」的領先指標,僅此而已。一個團隊可以把這些全做齊、衝到一萬顆星,卻仍然沒有任何會付費或留下來的用戶。請把這裡當成「注意力如何被贏得」的地圖,而不是成功的記分板。',
    footMethod: '每個數字都從即時資料集重算——星數、發表事件、issue/PR 活躍度與跨 star 網路,全部來自公開的 GitHub 歷史,加上 HN、Product Hunt、YC Launch 紀錄與 GH Archive。當某個發現可能被 repo 規模干擾時,我們會回報「控制了年齡與語言後」的關聯。完整限制見 [Methodology](/methodology)——尤其是倖存者偏誤,它讓所有「做了同樣的事卻沒能成功」的團隊隱形。',
  },
  'zh-Hans': {
    eyebrow: 'The Playbook',
    h1: '我们从 {n} 家「«开源创业公司»」身上学到的事。',
    lede: '这是我们在数据中观察到、{n} 家 YC 开源公司共有的模式——每一条都对应一个直接从公开历史算出、会随数据更新重算的数字。最让我们意外的是,它们与创业界的经典观点高度呼应:数据一再落回 Paul Graham 与 [YC library](https://www.ycombinator.com/library) 讲了多年的同一套建议——所以我们给每个发现都配上了它所印证的那篇文章。但请记住,这些是 **观察,不是教条**:它们是成长中的团队之间的相关性,不是因果证明,也看不见那些做了同样的事却没成功的人。',
    inPractice: '实际案例',
    echoesCanon: '与经典呼应',
    footAttention: '**所有提醒里最该记住的一条:** 这里每个数字衡量的都是 **注意力**——星标、发布、评论——而不是营收、留存,或底下到底有没有一门生意。星标只是「有人注意到了」的领先指标,仅此而已。一个团队可以把这些全做齐、冲到一万颗星,却仍然没有任何会付费或留下来的用户。请把这里当成「注意力如何被赢得」的地图,而不是成功的记分牌。',
    footMethod: '每个数字都从实时数据集重算——星标、发布事件、issue/PR 活跃度与跨 star 网络,全部来自公开的 GitHub 历史,加上 HN、Product Hunt、YC Launch 记录与 GH Archive。当某个发现可能被 repo 规模干扰时,我们会报告「控制了年龄与语言后」的关联。完整限制见 [Methodology](/methodology)——尤其是幸存者偏差,它让所有「做了同样的事却没能成功」的团队隐形。',
  },
  ja: jaRaw.ui as PBChrome, ko: koRaw.ui as PBChrome, pt: ptRaw.ui as PBChrome,
};

// thematic acts (deck section dividers)
export const PB_ACTS: Partial<Record<Locale, Record<string, { title: string; sub: string }>>> = {
  en: {
    found: { title: 'Get found', sub: 'How they reached the first users.' },
    curve: { title: 'Keep the curve alive', sub: 'Turning a spike into sustained, compounding growth.' },
    people: { title: 'People & the ecosystem', sub: 'Who builds it, and the network it plugs into.' },
    business: { title: 'Business & house style', sub: 'How the open source becomes a company.' },
  },
  'zh-Hant': {
    found: { title: '讓人發現你', sub: '他們如何觸及最初的用戶。' },
    curve: { title: '讓曲線持續', sub: '把一次尖峰變成持續、複利的成長。' },
    people: { title: '人與生態系', sub: '由誰打造,以及它接上的網路。' },
    business: { title: '商業與樣板美學', sub: '開源如何變成一門生意。' },
  },
  'zh-Hans': {
    found: { title: '让人发现你', sub: '他们如何触及最初的用户。' },
    curve: { title: '让曲线持续', sub: '把一次尖峰变成持续、复利的成长。' },
    people: { title: '人与生态', sub: '由谁打造,以及它接上的网络。' },
    business: { title: '商业与样板美学', sub: '开源如何变成一门生意。' },
  },
  ja: {
    found: { title: '見つけてもらう', sub: '最初のユーザーにどう届いたか。' },
    curve: { title: '曲線を生かし続ける', sub: '一度のスパイクを、持続し複利で伸びる成長に変える。' },
    people: { title: '人とエコシステム', sub: '誰が作るか、そしてどのネットワークに接続するか。' },
    business: { title: 'ビジネスとハウススタイル', sub: 'オープンソースがどう会社になるか。' },
  },
  ko: {
    found: { title: '발견되기', sub: '첫 사용자에게 어떻게 닿았는가.' },
    curve: { title: '곡선을 살려두기', sub: '한 번의 급등을 지속적이고 복리로 자라는 성장으로.' },
    people: { title: '사람과 생태계', sub: '누가 만드는가, 그리고 어떤 네트워크에 연결되는가.' },
    business: { title: '비즈니스와 하우스 스타일', sub: '오픈소스가 어떻게 회사가 되는가.' },
  },
  pt: {
    found: { title: 'Ser encontrado', sub: 'Como chegaram aos primeiros usuários.' },
    curve: { title: 'Manter a curva viva', sub: 'Transformar um pico em crescimento sustentado e composto.' },
    people: { title: 'Pessoas e ecossistema', sub: 'Quem constrói, e a rede em que se conecta.' },
    business: { title: 'Negócio e house style', sub: 'Como o open source vira uma empresa.' },
  },
};

// Essay/source attributions reused across locales (not translated).
const SRC = {
  ds: { author: 'Paul Graham', source: "Do Things that Don't Scale", url: 'https://paulgraham.com/ds.html' },
  growth: { author: 'Paul Graham', source: 'Startup = Growth', url: 'https://paulgraham.com/growth.html' },
  superlinear: { author: 'Paul Graham', source: 'Superlinear Returns', url: 'https://paulgraham.com/superlinear.html' },
  stubborn: { author: 'Paul Graham', source: 'The Right Kind of Stubborn', url: 'https://paulgraham.com/persistence.html' },
  aord: { author: 'Paul Graham', source: 'Default Alive or Default Dead?', url: 'https://paulgraham.com/aord.html' },
  founders: { author: 'Paul Graham', source: 'What We Look for in Founders', url: 'https://paulgraham.com/founders.html' },
  ideas: { author: 'Paul Graham', source: 'How to Get Startup Ideas', url: 'https://paulgraham.com/startupideas.html' },
  school: { author: 'Y Combinator', source: 'Startup School', url: 'https://www.ycombinator.com/library' },
  talk: { author: 'Y Combinator', source: 'How to Talk to Users', url: 'https://www.ycombinator.com/library' },
  mswpw: { author: 'Y Combinator', source: 'Make Something People Want', url: 'https://www.ycombinator.com/library' },
};

// Echo attributions per lesson, in order — reattached to agent-translated principle strings
// (the JSON files carry only the translated quotes, to keep them compact and verifiable).
const ECHO_SRC: Record<string, { author: string; source: string; url: string }[]> = {
  hn: [SRC.school, SRC.growth], ph: [SRC.growth], responsive: [SRC.talk],
  compound: [SRC.growth, SRC.superlinear], evergreen: [SRC.stubborn, SRC.aord],
  team: [SRC.founders], network: [SRC.ds], license: [], house: [SRC.mswpw, SRC.ideas],
};
function adapt(raw: any): Record<string, LessonT> {
  const out: Record<string, LessonT> = {};
  for (const key of Object.keys(raw.lessons)) {
    const L = raw.lessons[key];
    out[key] = { ...L, echoes: (L.echoes || []).map((p: string, i: number) => ({ principle: p, ...(ECHO_SRC[key]?.[i] || {}) })) };
  }
  return out;
}

export const PB_LESSONS: Partial<Record<Locale, Record<string, LessonT>>> = {
  ja: adapt(jaRaw), ko: adapt(koRaw), pt: adapt(ptRaw),
  'zh-Hant': {
    hn: {
      title: '上 Hacker News——然後一次又一次地上',
      statLabel: '中位星數:有 vs 沒有衝上 HN 熱門的貼文',
      kicker: '{multiPct}% 不只發一次 · 中位 {medHnPosts} 篇',
      body: [
        '在這份資料的所有訊號裡,Hacker News 首頁是最顯眼的一個。有貼文衝破 100 分的 repo,中位星數 {hnHi},沒有的只有 {hnLo}——大約 {hnMx}。幾乎每條 star 曲線上最陡的那道斷崖,都是某個 HN 日。',
        '而且它幾乎是標配:這份資料裡 {showHnPct}% 的 repo 至少有過一篇衝破 100 分的 HN 貼文。「Show HN」在這個世界不是特例——它是預設的第一步。',
        '但「上 Hacker News」嚴重低估了贏家真正做的事。他們之中有 {multiPct}% 不只發一次,平均每家有 {medHnPosts} 篇值得一提的貼文。它的形狀是節奏,不是瞬間:公司剛起步時來一篇 Launch HN,每個重要功能來一篇 Show HN,有真正有趣的東西上線時來一篇 Tell HN 或技術深度文。每一篇都是對首頁的一次重新擲骰,也是一批全新的初次用戶。',
        '真正的重點是「許可」,不是「壓力」:你是被允許再回來的。一次表現不如預期的發表,不是對公司的判決——它只是某個星期二的一篇貼文。成長起來的團隊,持續找到誠實的理由一再現身,持續了好幾年。紀律在於:每次 relaunch 都要能獨立成為新聞;一篇沒有真材實料的貼文,只會花掉上一篇累積下來的善意。',
      ],
      echoes: [
        { principle: '你可以發表不只一次。為每個真正的里程碑重新發表是被期待的——每次都有新的觀眾看到,而首頁每天重置。', ...SRC.school },
        { principle: '新創是為了快速成長而生;反覆把產品送到用戶面前是本份,不是一次性的事件。', ...SRC.growth },
      ],
      caveat: '相關不等於因果——強產品本來就更容易衝上 HN 首頁。即使控制了 repo 年齡與語言,這個關聯仍然成立(約 {ctrlHN})且統計顯著,但無法排除對未觀測品質的選擇偏誤。我們每個 repo 只保留前 6 篇 HN 貼文,所以「重複發表率」是下限。',
      compare: { aLabel: '有衝上 HN 的貼文', bLabel: '沒有' },
    },
    ph: {
      title: '每個管道都做,不只押一個',
      statLabel: '中位星數:有 vs 沒有 Product Hunt 發表',
      body: [
        'Product Hunt 觸及的是和 Hacker News 不同的一群人——maker、產品經理、設計師、在物色工具的創辦人。有做 Product Hunt 發表的 {phCount} 個 repo,中位星數 {phHi},沒有的只有 {phLo}。',
        '最大的那些專案,模式不是 HN 「或」 PH——而是兩個都做,再加上一篇發表部落格、相關的 subreddit、一場研討會演講,還有出現在別人的留言串裡。每個管道都是一池不同的早期採用者,而把每一池都撈過一遍,是不可規模化的、土法煉鋼的工作。這正是它會複利的原因:大多數團隊默默地不願意做。',
      ],
      echoes: [
        { principle: '新創是一家為了快速成長而打造的公司;成長是定義它的唯一指標,而你要去用戶聚集的每一個地方找他們。', ...SRC.growth },
      ],
      caveat: '只有 {phCount} 個 repo 做了 Product Hunt 發表,所以這個倍率請寬鬆地讀。即使控制了 repo 年齡與語言,關聯依然很大(約 {ctrlPH})——但會去 PH 發表的本來就是已經 launch-ready、夠精緻的團隊,真正起作用的可能是這個自我選擇,而不是發表本身。',
      compare: { aLabel: '有做 PH 發表', bLabel: '沒有' },
    },
    responsive: {
      title: '回覆你的 issue——和你的用戶對話',
      statLabel: '中位星數,依 issue 回應程度',
      body: [
        '開源讓一個創辦人習慣變得異常可量測:你回不回覆別人?平均每個 issue 有 2 則以上留言的 repo,中位星數 {respHiV},冷清的只有 {respLoV}。',
        '回覆一個 issue,就是開源版的「和用戶對話」——一次一對一、不可規模化、也本來就不該規模化的動作。它讓陌生人知道另一端有個真人,把一張 bug 回報變成一段關係,並用用戶自己的話教你下一步該做什麼。這裡的複利是社群性的:覺得被聽見的貢獻者會留下,而留下的人會成為在你撐不住時扛起專案的維護者。',
      ],
      echoes: [
        { principle: '直接且持續地和你的用戶對話;是他們的回饋、而非你的直覺,才是 roadmap。回覆一個 issue,就是這場對話的公開版。', ...SRC.talk },
      ],
      caveat: '熱門 repo 本來就吸引更多留言——互動與規模互相強化,所以請把它讀成一個迴圈,而不是單向的槓桿。控制了年齡與語言後關聯確實仍然成立(約 {ctrlResp}),但回應度有一部分是流量的下游結果。',
      compare: { aLabel: '每 issue 2+ 留言', bLabel: '較冷清' },
    },
    compound: {
      title: '成長是複利——不是一次爆炸',
      statLabel: '最大單日佔總星數的比例(中位)',
      body: [
        '我們很容易想像這些公司是被某個爆紅的下午造就的。數據說的剛好相反:最大的單日,中位只佔一個 repo 總星數的 {compoundPct}%。曲線剩下九成多,是靠中間每一個平凡的日子堆起來的。',
        '發表是火花;另外的 97% 是「持續出貨」——commit 落地、issue 關閉、release 切出、文章寫成,月復一月。從外面看起來突然的成長,幾乎總是早就在複利、只是在跨過某個門檻前一直看不見。真正的紀律不是設計一次爆炸,而是在曲線轉折之前,拒絕停下來。',
      ],
      echoes: [
        { principle: '新創的定義是複利成長——每週幾個百分點——而不是任何單一的尖峰;把成長率顧好,絕對數字會自己長出來。', ...SRC.growth },
        { principle: '回報是超線性複利的:微小但持續的優勢,會滾成遠大於當初投入的結果。', ...SRC.superlinear },
      ],
      caveat: '在星數 >500 的 repo 上計算;太小的 repo 雜訊較大,單一尖峰就可能主宰整體。',
    },
    evergreen: {
      title: '打長期戰',
      statLabel: '從第一個 commit 到 1,000 顆星的中位時間',
      kicker: '公開發表前先默默開發約 {preLaunch} 個月',
      body: [
        '一夜成功是倖存者偏誤最愛的幻覺。這裡中位的 repo,從第一個 commit 到 1,000 顆星花了 {to1k} 個月,到 10,000 顆星花了 {to10k} 個月。多數還在第一次公開發表前,默默開發了中位 {preLaunch} 個月——在任何人注意到之前,有一段漫長而不起眼的跑道。',
        '耐久度是故事的另一半。{total} 個 repo 裡有 {everCount} 個是「常青(evergreen)」:中位 {everAge} 歲,而且每週仍在出 ~{everCpw} 個 commit。讓它們與眾不同的,與其說是天賦,不如說是韌性——在發表日的興奮早就退潮之後,依然願意持續現身。',
      ],
      echoes: [
        { principle: '最好的創辦人對「目的地」固執,對「路線」彈性——贏的是帶著判斷力的堅持,而不是盲目的僵硬。', ...SRC.stubborn },
        { principle: '搞清楚你是 default alive 還是 default dead;耐久度是靠「活得夠久、讓複利有意義」掙來的。', ...SRC.aord },
      ],
      caveat: '倖存者偏誤——死掉、被下架的公司不在這份資料裡。時間只在「有完整早期 star 歷史」時計算;建立在更老的程式碼基礎(fork)上的 repo 會被算得偏長。',
    },
    team: {
      title: '組一支團隊,別單打獨鬥',
      statLabel: '最大貢獻者佔比:最大 vs 最小的 repo',
      body: [
        '在最大的 40 個 repo 裡,最大貢獻者中位寫了 {teamBig}% 的 commit;在最小的 40 個裡,這個數字是 {teamSmall}%。到了規模化的階段,「一雙手」和「一個大專案」幾乎不會共存。',
        '這不是在貶低那個開頭單幹的人——幾乎所有東西一開始都是高度集中的。整份資料裡,最大貢獻者中位仍寫了 {medTop1}% 的 commit,而一位核心作者(往往就是那個開源專案原本的維護者、如今的創辦人)正是大多數 repo 的可信度與起點所在。這條講的是「成長需要什麼」:到了某個點,工作必須擴散出去——給共同創辦人、給早期員工、給外部貢獻者社群。真正規模化的專案,是那些創辦人「夠快讓自己在程式碼裡變得可被取代」、好讓專案長得比自己大的團隊。',
      ],
      echoes: [
        { principle: '要有不只一位創辦人。單一創辦人是新創失敗最常見的原因之一——工作量、士氣與決策,對一個人來說都太重了。', ...SRC.founders },
      ],
      caveat: '因果方向不明:規模讓你能招人,招人又推動規模,兩者互相拉扯。',
      compare: { aLabel: '最大的 40 個 repo', bLabel: '最小的 40 個' },
    },
    network: {
      title: 'YC 生態系替你播下最初的星',
      statLabel: '一個 repo「前 100 顆星」來自 YC 開源網路的中位比例',
      kicker: '前 100 顆星 {early100}% · 前 1,000 顆 {early1000}%',
      body: [
        '最初的那些星到底從哪來?壓倒性地,來自自己人。一個 repo 的前 100 位 star 者,中位有 {early100}% 同時也 star 了至少兩個「其他」的 YC 開源 repo——前 1,000 位則是 {early1000}%。攤到全部時間,它停在 {netLifetime}%,所以這個網路不只是個種子,而是長期維持的一塊觀眾。',
        '這是整份資料裡,對「新創界最常被引用的那句建議」最字面的印證:親手去你伸手可及的圈子裡,一個一個找到你的最初用戶。對一家 YC 公司來說,那個圈子是一張由創辦人、員工與校友織成、密集而重疊的圖,他們會穩定地為彼此的發表現身。誠實的解讀是雙面的——比例高,代表生態系給了你一個起跑的助力;比例低,代表你更早就觸及了真正的陌生人。兩者本身都不是目標;從前者走向後者的那條軌跡才是。',
      ],
      echoes: [
        { principle: '親手、一個一個地找到你的最初用戶,並用非常手段讓他們開心——它不可規模化,而這正是重點。', ...SRC.ds },
      ],
      caveat: '嚴格定義:一位 star 者只有在另外 star 了「≥2 個其他」YC repo 時才算「網路」(被檢視的這個 repo 本身被排除),所以數字不會被自我計數灌水。跨 star 是共同推廣加上重疊的觀眾——一部分是被共同行銷的群體的預期結構,不是任何單一創辦人能完全掌控的管道。純結構推導;不指名任何個人。',
    },
    license: {
      title: '你選的 License 就是一套變現策略',
      statLabel: '採用寬鬆授權(MIT / Apache / BSD)的比例',
      kicker: '{copyleftPct}% 用 copyleft 來護住託管服務',
      body: [
        'License 看起來像法律註腳,實際上是一個 go-to-market 決策。這些公司有 {permissivePct}% 採用寬鬆授權——MIT、Apache、BSD——把「最低摩擦的採用」優化到極致:任何人都能嵌入、fork、塞進閉源產品裡,不必問你。其中 {mitPct}% specifically 選了 MIT。當開源專案是漏斗的頂端、而你賣的是另一層(託管雲、支援、企業功能)時,你會這樣選。',
        '另外 {copyleftPct}% 走反方向,選 copyleft——GPL,或越來越多的 AGPL。AGPL 強制任何「把改過的版本當網路服務在跑」的人公開他們的改動,這讓某個 hyperscaler 很難把你的專案 fork 成一個閉源的競品 SaaS。當託管版本就是你的生意時,那就是護城河:你可以真正開源,同時握住商業上的制高點。License 跟著模式走——寬鬆是為了極大化觸及,保護型是為了守住一門服務。',
        '我們看不到營收,所以這不是在說哪種 License 比較會賺——而是 License 把策略給編碼進去了,而且多數團隊是刻意選的。從保護型 relicense 到寬鬆,遠比反過來容易,所以你「出貨時的預設」可能會悄悄把你唯一的護城河送掉。',
      ],
      echoes: [],
      caveat: 'License 讀自每個 repo 宣告的 SPDX 授權。某個選擇實際上有沒有幫到變現,在這裡無法觀測——這談的是「被編碼的策略」,不是「被量測的結果」。',
    },
    house: {
      title: '「同一套樣板」是真的——但它不是引擎',
      statLabel: '品牌名是單一字詞的公司比例',
      kicker: '{nonComPct}% 用非 .com 網域 · {ossPct}% 寫「open source」· {tsPct}% 用 TypeScript',
      body: [
        '看夠多這些公司,一套「樣板美學」會浮現出來,明顯而趨同。{singleTokenPct}% 用單一字詞當品牌——短、抽象、小寫,中位八個字元:bun、fig、modal、turso、beam、daily。{nonComPct}% 已經完全放棄 .com,落腳在 .dev、.io、.ai 或 .sh。命名這場遊戲有它的文法,而幾乎所有人都在說這套文法。',
        '定位也在趨同。{ossPct}% 把「open source」直接寫進一句話的 pitch,{infraPct}% 把自己定位成 managed infrastructure——一個 platform、一個 database、一個 API、一朵 cloud。這就是「開源楔子 + 託管層」的樣板,擺明了在那:拿一塊開發者已經愛用、卻又懶得自己維運的基礎設施,賣它的託管版。引擎蓋底下,趨同還在繼續——{tsPct}% 以 TypeScript 為主,和 pnpm、Turborepo、repo 內 MDX 文件聚成同一個辨識度極高的 monorepo 輪廓(Python 與 AI 那群是房間的另一半)。',
        '誠實的部分來了。這些都不會造成成長。一個單字的 .dev 名字加一個 Stripe 風的文件站,是制服,不是引擎——它向用戶、同行與投資人發出「我在玩同一場遊戲」的訊號,而這種「可被讀懂」確實有價值,但每個競爭對手都穿同一套制服。趨同本身,正是它無法讓你與眾不同的原因。差異化得來自樣板碰不到的地方:你選的楔子、時機,以及你到底有沒有做出人們想要的東西。',
      ],
      echoes: [
        { principle: '到頭來只有一件事重要:做出人們想要的東西。表面的精緻與定位是手段,從來不是本體。', ...SRC.mswpw },
        { principle: '活在未來、把缺的東西做出來;點子和楔子,遠比公司「穿得怎樣」重要。', ...SRC.ideas },
      ],
      caveat: '命名、網域與技術棧是從公開網站與 repo 觀察來的;「樣板美學」是趨同,不是成長槓桿。創辦人背景、定價與視覺設計不在這份資料裡,這裡也不對它們下任何結論。',
    },
  },
  'zh-Hans': {
    hn: {
      title: '上 Hacker News——然后一次又一次地上',
      statLabel: '中位星标:有 vs 没有冲上 HN 热门的帖子',
      kicker: '{multiPct}% 不只发一次 · 中位 {medHnPosts} 篇',
      body: [
        '在这份数据的所有信号里,Hacker News 首页是最显眼的一个。有帖子冲破 100 分的 repo,中位星标 {hnHi},没有的只有 {hnLo}——大约 {hnMx}。几乎每条 star 曲线上最陡的那道断崖,都是某个 HN 日。',
        '而且它几乎是标配:这份数据里 {showHnPct}% 的 repo 至少有过一篇冲破 100 分的 HN 帖子。「Show HN」在这个世界不是特例——它是默认的第一步。',
        '但「上 Hacker News」严重低估了赢家真正做的事。他们之中有 {multiPct}% 不只发一次,平均每家有 {medHnPosts} 篇值得一提的帖子。它的形状是节奏,不是瞬间:公司刚起步时来一篇 Launch HN,每个重要功能来一篇 Show HN,有真正有趣的东西上线时来一篇 Tell HN 或技术深度文。每一篇都是对首页的一次重新掷骰,也是一批全新的首次用户。',
        '真正的重点是「许可」,不是「压力」:你是被允许再回来的。一次表现不如预期的发布,不是对公司的判决——它只是某个星期二的一篇帖子。成长起来的团队,持续找到诚实的理由一再现身,持续了好几年。纪律在于:每次 relaunch 都要能独立成为新闻;一篇没有真材实料的帖子,只会花掉上一篇积累下来的善意。',
      ],
      echoes: [
        { principle: '你可以发布不只一次。为每个真正的里程碑重新发布是被期待的——每次都有新的观众看到,而首页每天重置。', ...SRC.school },
        { principle: '创业公司是为了快速成长而生;反复把产品送到用户面前是本分,不是一次性的事件。', ...SRC.growth },
      ],
      caveat: '相关不等于因果——强产品本来就更容易冲上 HN 首页。即使控制了 repo 年龄与语言,这个关联仍然成立(约 {ctrlHN})且统计显著,但无法排除对未观测质量的选择偏差。我们每个 repo 只保留前 6 篇 HN 帖子,所以「重复发布率」是下限。',
      compare: { aLabel: '有冲上 HN 的帖子', bLabel: '没有' },
    },
    ph: {
      title: '每个渠道都做,不只押一个',
      statLabel: '中位星标:有 vs 没有 Product Hunt 发布',
      body: [
        'Product Hunt 触及的是和 Hacker News 不同的一群人——maker、产品经理、设计师、在物色工具的创始人。有做 Product Hunt 发布的 {phCount} 个 repo,中位星标 {phHi},没有的只有 {phLo}。',
        '最大的那些项目,模式不是 HN 「或」 PH——而是两个都做,再加上一篇发布博客、相关的 subreddit、一场大会演讲,还有出现在别人的评论串里。每个渠道都是一池不同的早期采用者,而把每一池都捞过一遍,是不可规模化的、土法炼钢的工作。这正是它会复利的原因:大多数团队默默地不愿意做。',
      ],
      echoes: [
        { principle: '创业公司是一家为了快速成长而打造的公司;成长是定义它的唯一指标,而你要去用户聚集的每一个地方找他们。', ...SRC.growth },
      ],
      caveat: '只有 {phCount} 个 repo 做了 Product Hunt 发布,所以这个倍率请宽松地读。即使控制了 repo 年龄与语言,关联依然很大(约 {ctrlPH})——但会去 PH 发布的本来就是已经 launch-ready、够精致的团队,真正起作用的可能是这个自我选择,而不是发布本身。',
      compare: { aLabel: '有做 PH 发布', bLabel: '没有' },
    },
    responsive: {
      title: '回复你的 issue——和你的用户对话',
      statLabel: '中位星标,按 issue 响应程度',
      body: [
        '开源让一个创始人习惯变得异常可量测:你回不回复别人?平均每个 issue 有 2 条以上评论的 repo,中位星标 {respHiV},冷清的只有 {respLoV}。',
        '回复一个 issue,就是开源版的「和用户对话」——一次一对一、不可规模化、也本来就不该规模化的动作。它让陌生人知道另一端有个真人,把一张 bug 报告变成一段关系,并用用户自己的话教你下一步该做什么。这里的复利是社群性的:觉得被听见的贡献者会留下,而留下的人会成为在你撑不住时扛起项目的维护者。',
      ],
      echoes: [
        { principle: '直接且持续地和你的用户对话;是他们的反馈、而非你的直觉,才是 roadmap。回复一个 issue,就是这场对话的公开版。', ...SRC.talk },
      ],
      caveat: '热门 repo 本来就吸引更多评论——互动与规模互相强化,所以请把它读成一个循环,而不是单向的杠杆。控制了年龄与语言后关联确实仍然成立(约 {ctrlResp}),但响应度有一部分是流量的下游结果。',
      compare: { aLabel: '每 issue 2+ 评论', bLabel: '较冷清' },
    },
    compound: {
      title: '成长是复利——不是一次爆炸',
      statLabel: '最大单日占总星标的比例(中位)',
      body: [
        '我们很容易想象这些公司是被某个爆红的下午造就的。数据说的恰好相反:最大的单日,中位只占一个 repo 总星标的 {compoundPct}%。曲线剩下九成多,是靠中间每一个平凡的日子堆起来的。',
        '发布是火花;另外的 97% 是「持续交付」——commit 落地、issue 关闭、release 切出、文章写成,月复一月。从外面看起来突然的成长,几乎总是早就在复利、只是在跨过某个门槛前一直看不见。真正的纪律不是设计一次爆炸,而是在曲线转折之前,拒绝停下来。',
      ],
      echoes: [
        { principle: '创业公司的定义是复利成长——每周几个百分点——而不是任何单一的尖峰;把成长率顾好,绝对数字会自己长出来。', ...SRC.growth },
        { principle: '回报是超线性复利的:微小但持续的优势,会滚成远大于当初投入的结果。', ...SRC.superlinear },
      ],
      caveat: '在星标 >500 的 repo 上计算;太小的 repo 噪声较大,单一尖峰就可能主宰整体。',
    },
    evergreen: {
      title: '打长期战',
      statLabel: '从第一个 commit 到 1,000 颗星的中位时间',
      kicker: '公开发布前先默默开发约 {preLaunch} 个月',
      body: [
        '一夜成功是幸存者偏差最爱的幻觉。这里中位的 repo,从第一个 commit 到 1,000 颗星花了 {to1k} 个月,到 10,000 颗星花了 {to10k} 个月。多数还在第一次公开发布前,默默开发了中位 {preLaunch} 个月——在任何人注意到之前,有一段漫长而不起眼的跑道。',
        '耐久度是故事的另一半。{total} 个 repo 里有 {everCount} 个是「常青(evergreen)」:中位 {everAge} 岁,而且每周仍在出 ~{everCpw} 个 commit。让它们与众不同的,与其说是天赋,不如说是韧性——在发布日的兴奋早就退潮之后,依然愿意持续现身。',
      ],
      echoes: [
        { principle: '最好的创始人对「目的地」固执,对「路线」灵活——赢的是带着判断力的坚持,而不是盲目的僵硬。', ...SRC.stubborn },
        { principle: '搞清楚你是 default alive 还是 default dead;耐久度是靠「活得够久、让复利有意义」挣来的。', ...SRC.aord },
      ],
      caveat: '幸存者偏差——死掉、被下架的公司不在这份数据里。时间只在「有完整早期 star 历史」时计算;建立在更老的代码基础(fork)上的 repo 会被算得偏长。',
    },
    team: {
      title: '组一支团队,别单打独斗',
      statLabel: '最大贡献者占比:最大 vs 最小的 repo',
      body: [
        '在最大的 40 个 repo 里,最大贡献者中位写了 {teamBig}% 的 commit;在最小的 40 个里,这个数字是 {teamSmall}%。到了规模化的阶段,「一双手」和「一个大项目」几乎不会共存。',
        '这不是在贬低那个开头单干的人——几乎所有东西一开始都是高度集中的。整份数据里,最大贡献者中位仍写了 {medTop1}% 的 commit,而一位核心作者(往往就是那个开源项目原本的维护者、如今的创始人)正是大多数 repo 的可信度与起点所在。这条讲的是「成长需要什么」:到了某个点,工作必须扩散出去——给联合创始人、给早期员工、给外部贡献者社群。真正规模化的项目,是那些创始人「够快让自己在代码里变得可被取代」、好让项目长得比自己大的团队。',
      ],
      echoes: [
        { principle: '要有不只一位创始人。单一创始人是创业失败最常见的原因之一——工作量、士气与决策,对一个人来说都太重了。', ...SRC.founders },
      ],
      caveat: '因果方向不明:规模让你能招人,招人又推动规模,两者互相拉扯。',
      compare: { aLabel: '最大的 40 个 repo', bLabel: '最小的 40 个' },
    },
    network: {
      title: 'YC 生态替你播下最初的星',
      statLabel: '一个 repo「前 100 颗星」来自 YC 开源网络的中位比例',
      kicker: '前 100 颗星 {early100}% · 前 1,000 颗 {early1000}%',
      body: [
        '最初的那些星到底从哪来?压倒性地,来自自己人。一个 repo 的前 100 位 star 者,中位有 {early100}% 同时也 star 了至少两个「其他」的 YC 开源 repo——前 1,000 位则是 {early1000}%。摊到全部时间,它停在 {netLifetime}%,所以这个网络不只是个种子,而是长期维持的一块观众。',
        '这是整份数据里,对「创业界最常被引用的那句建议」最字面的印证:亲手去你伸手可及的圈子里,一个一个找到你的最初用户。对一家 YC 公司来说,那个圈子是一张由创始人、员工与校友织成、密集而重叠的图,他们会稳定地为彼此的发布现身。诚实的解读是双面的——比例高,代表生态给了你一个起跑的助力;比例低,代表你更早就触及了真正的陌生人。两者本身都不是目标;从前者走向后者的那条轨迹才是。',
      ],
      echoes: [
        { principle: '亲手、一个一个地找到你的最初用户,并用非常手段让他们开心——它不可规模化,而这正是重点。', ...SRC.ds },
      ],
      caveat: '严格定义:一位 star 者只有在另外 star 了「≥2 个其他」YC repo 时才算「网络」(被检视的这个 repo 本身被排除),所以数字不会被自我计数灌水。跨 star 是共同推广加上重叠的观众——一部分是被共同营销的群体的预期结构,不是任何单一创始人能完全掌控的渠道。纯结构推导;不指名任何个人。',
    },
    license: {
      title: '你选的 License 就是一套变现策略',
      statLabel: '采用宽松授权(MIT / Apache / BSD)的比例',
      kicker: '{copyleftPct}% 用 copyleft 来护住托管服务',
      body: [
        'License 看起来像法律脚注,实际上是一个 go-to-market 决策。这些公司有 {permissivePct}% 采用宽松授权——MIT、Apache、BSD——把「最低摩擦的采用」优化到极致:任何人都能嵌入、fork、塞进闭源产品里,不必问你。其中 {mitPct}% 专门选了 MIT。当开源项目是漏斗的顶端、而你卖的是另一层(托管云、支持、企业功能)时,你会这样选。',
        '另外 {copyleftPct}% 走反方向,选 copyleft——GPL,或越来越多的 AGPL。AGPL 强制任何「把改过的版本当网络服务在跑」的人公开他们的改动,这让某个 hyperscaler 很难把你的项目 fork 成一个闭源的竞品 SaaS。当托管版本就是你的生意时,那就是护城河:你可以真正开源,同时握住商业上的制高点。License 跟着模式走——宽松是为了极大化触及,保护型是为了守住一门服务。',
        '我们看不到营收,所以这不是在说哪种 License 比较会赚——而是 License 把策略给编码进去了,而且多数团队是刻意选的。从保护型 relicense 到宽松,远比反过来容易,所以你「交付时的默认」可能会悄悄把你唯一的护城河送掉。',
      ],
      echoes: [],
      caveat: 'License 读自每个 repo 声明的 SPDX 授权。某个选择实际上有没有帮到变现,在这里无法观测——这谈的是「被编码的策略」,不是「被量测的结果」。',
    },
    house: {
      title: '「同一套样板」是真的——但它不是引擎',
      statLabel: '品牌名是单一词的公司比例',
      kicker: '{nonComPct}% 用非 .com 域名 · {ossPct}% 写「open source」· {tsPct}% 用 TypeScript',
      body: [
        '看够多这些公司,一套「样板美学」会浮现出来,明显而趋同。{singleTokenPct}% 用单一词当品牌——短、抽象、小写,中位八个字符:bun、fig、modal、turso、beam、daily。{nonComPct}% 已经完全放弃 .com,落脚在 .dev、.io、.ai 或 .sh。命名这场游戏有它的文法,而几乎所有人都在说这套文法。',
        '定位也在趋同。{ossPct}% 把「open source」直接写进一句话的 pitch,{infraPct}% 把自己定位成 managed infrastructure——一个 platform、一个 database、一个 API、一朵 cloud。这就是「开源楔子 + 托管层」的样板,摆明了在那:拿一块开发者已经爱用、却又懒得自己运维的基础设施,卖它的托管版。引擎盖底下,趋同还在继续——{tsPct}% 以 TypeScript 为主,和 pnpm、Turborepo、repo 内 MDX 文档聚成同一个辨识度极高的 monorepo 轮廓(Python 与 AI 那群是房间的另一半)。',
        '诚实的部分来了。这些都不会造成成长。一个单字的 .dev 名字加一个 Stripe 风的文档站,是制服,不是引擎——它向用户、同行与投资人发出「我在玩同一场游戏」的信号,而这种「可被读懂」确实有价值,但每个竞争对手都穿同一套制服。趋同本身,正是它无法让你与众不同的原因。差异化得来自样板碰不到的地方:你选的楔子、时机,以及你到底有没有做出人们想要的东西。',
      ],
      echoes: [
        { principle: '到头来只有一件事重要:做出人们想要的东西。表面的精致与定位是手段,从来不是本体。', ...SRC.mswpw },
        { principle: '活在未来、把缺的东西做出来;点子和楔子,远比公司「穿得怎样」重要。', ...SRC.ideas },
      ],
      caveat: '命名、域名与技术栈是从公开网站与 repo 观察来的;「样板美学」是趋同,不是成长杠杆。创始人背景、定价与视觉设计不在这份数据里,这里也不对它们下任何结论。',
    },
  },
};
