import type { EventCategory, HistoricalEvent } from "@/types/event";

/**
 * 事件分類：建國與政治、戰爭、外交條約、革命獨立、科學發明、經濟貿易、文化宗教，分不出來的歸「其他」。
 * 年表原文沒有分類，這裡依標題（標題分不出來再看說明）裡的關鍵字自動判斷，所以偶爾會分錯；
 * 規則依序比對，先比到的算數（例如「簽訂條約」先算外交，「獨立戰爭」先算革命）。
 */
export type ShownCategory = Exclude<EventCategory, "exploration">;

/** 篩選、圖例、時間軸密度條的順序與顏色（地球上的事件點同色） */
export const CATEGORIES: { id: ShownCategory; color: string }[] = [
  { id: "politics", color: "#b18cff" },
  { id: "war", color: "#ff5f5f" },
  { id: "diplomacy", color: "#4fc3f7" },
  { id: "revolution", color: "#ff9a3c" },
  { id: "science", color: "#4fd69c" },
  { id: "economy", color: "#f5d547" },
  { id: "culture", color: "#ff8fc2" },
  { id: "other", color: "#9aa4b5" },
];

const COLOR = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color])) as Record<ShownCategory, string>;

/** 「探險」（鄭和、哥倫布等示範事件）併入「科學與探險」 */
export function categoryOf(e: Pick<HistoricalEvent, "category">): ShownCategory {
  return e.category === "exploration" ? "science" : e.category;
}

export const categoryColor = (e: Pick<HistoricalEvent, "category">) => COLOR[categoryOf(e)];

/** 依勾選的分類篩選；null 表示全部顯示 */
export function filterByCategory<T extends Pick<HistoricalEvent, "category">>(events: T[], shown: ShownCategory[] | null): T[] {
  if (!shown) return events;
  const set = new Set(shown);
  return events.filter((e) => set.has(categoryOf(e)));
}

const RULES: [EventCategory, RegExp][] = [
  // 天災、意外先歸「其他」，免得「班機」「風暴」被當成科學或革命
  ["other", /地震|海嘯|颱風|颶風|風暴|暴風|洪水|水災|旱災|饑荒|飢荒|瘟疫|鼠疫|霍亂|疫情|傳染病|火山|空難|墜毀|墜機|沉沒|相撞|事故|火災|大火|失事|劫機|恐怖攻擊|恐攻|爆炸案|綁架|謀殺|暗殺未遂/],
  // 明確的外交字眼，排在戰爭前面：「停戰協定」「和約」算外交
  ["diplomacy", /條約|和約|協定|協議|公約|建交|斷交|簽訂|簽署|締結|停戰|議和|談判|和談|同盟國?成立|結盟/],
  // 地理大發現：「達伽馬航抵印度」「哥倫布到達美洲」排在戰爭前面（說明裡常提到征服）
  ["science", /(抵達|到達|航抵|航行到)(美洲|新大陸|印度|好望角|澳洲|菲律賓|日本|南極|北極|太平洋)|新航路|環球航行|發現新大陸|下西洋/],
  ["revolution", /革命|獨立|起義|起事|政變|叛亂|叛變|暴動|民變|抗議|示威|罷工|造反|推翻|兵變|起兵|反抗|學潮|騷亂|民主化|解嚴|抗爭/],
  ["war", /戰爭|戰役|之戰|會戰|海戰|戰鬥|大戰|入侵|侵略|圍攻|圍城|征服|攻打|攻陷|攻佔|攻占|攻克|攻入|擊敗|打敗|擊退|戰敗|戰勝|出兵|出征|遠征|劫掠|掠奪|屠殺|大屠殺|轟炸|空襲|登陸|佔領|占領|淪陷|艦隊|軍隊|軍事行動|北伐|西征|東征|十字軍|討伐|平定|鎮壓|解放|殖民戰|游擊|抵抗|親征|率軍|收復|派兵|奪下|奪取|奪回|突襲|襲擊|砲轟|炮轟|開戰|參戰|兵敗|陣亡/],
  ["diplomacy", /外交|同盟|聯盟|盟約|訪問|國事訪問|出使|使節|使團|朝貢|和親|加入|加盟|聯合國|國際聯盟|歐盟|北約|會議|峰會|會談|會晤|承認.*(獨立|主權|政府)|宣戰/],
  ["science", /發明|發現|科學|研究所|實驗|天文|數學|醫學|醫院|疫苗|手術|物理|化學|生物學|演化|電報|電話|電燈|電力|蒸汽機|飛機|飛行|火箭|衛星|太空|登月|探測|電腦|網際網路|網路|原子|核子|核能|核試|試爆|專利|望遠鏡|顯微鏡|印刷術|活字|曆法|地圖|測量|探險|航海|環球|首次抵達|第一次抵達|發射|諾貝爾/],
  ["economy", /經濟|貿易|商業|商人|商會|通商|開港|港口|市場|銀行|公司|企業|貨幣|錢幣|紙幣|鑄幣|通貨|歐元|人口普查|稅|關稅|財政|股市|股票|交易所|工業|工廠|產業|礦|煤|石油|鐵路|公路|運河|農業|土地改革|土地調查|墾|移民|絲路|茶|糖|香料|奴隸貿易|大蕭條|股災|金融|通膨|預算|專賣|博覽會/],
  ["culture", /宗教|佛|基督|天主|新教|東正教|伊斯蘭|回教|猶太|印度教|道教|儒|教宗|教會|教堂|主教|修道院|寺|廟|清真寺|傳教|聖人|封聖|藝術|文學|詩|小說|書籍|書院|史書|全書|寫成|聖經|古蘭經|手稿|經典|大學|學校|學院|教育|科舉|建築|落成|完工|建造|興建|宮殿|金字塔|長城|雕像|奧運|奧林匹克|世界盃|運動會|音樂|歌劇|繪畫|畫家|作家|文化|語言|文字|字母|哲學|思想|博物館|圖書館|劇|電影|電視|廣播|報紙|雜誌|出版|古蹟|遺址|世界遺產|節慶|文明|陶器|青銅|鐵器/],
  ["politics", /王朝|建國|立國|開國|建立|成立|創立|統一|即位|繼位|登基|加冕|稱帝|稱王|稱汗|稱號|攝政|統治|執政|在位|退位|廢黜|駕崩|國王|女王|皇帝|皇后|蘇丹|哈里發|法老|沙皇|大公|公爵|伯爵|總統|首相|總理|內閣|政府|選舉|大選|公投|國會|議會|憲法|法律|法令|法典|頒布|共和|帝國|王國|公國|併入|合併|割讓|分裂|滅亡|消滅|遷都|定都|改名|改國號|自治|殖民地|行省|設置|設立|廢除|改革|變法|維新|政黨|黨/],
];

export function classifyText(text: string): EventCategory {
  for (const [category, re] of RULES) if (re.test(text)) return category;
  return "other";
}

/** 先看標題，標題分不出來再看說明 */
export function classifyEvent(e: Pick<HistoricalEvent, "title" | "summary">): EventCategory {
  const byTitle = classifyText(e.title);
  return byTitle !== "other" ? byTitle : classifyText(e.summary ?? "");
}

/** 年表事件原本都是「其他」，載入後補上分類（已經分好的不動） */
export function withCategories(events: HistoricalEvent[]): HistoricalEvent[] {
  return events.map((e) => (e.category === "other" ? { ...e, category: classifyEvent(e) } : e));
}
