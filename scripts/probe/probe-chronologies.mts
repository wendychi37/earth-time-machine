/** 暫時用：找出世界各國在英文維基百科的歷史年表條目與條目數（GitHub Actions 執行後刪除） */
import { extractChronologyItems } from "../../src/lib/chronology/extract";
import { api, fetchPage } from "../wiki.mjs";

const C: [string, string, string][] = [
  ["ITA","Italian","Italy"],["AUT","Austrian","Austria"],["POL","Polish","Poland"],["IRL","Irish","Ireland"],["CHE","Swiss","Switzerland"],["GRC","Greek","Greece"],
  ["HUN","Hungarian","Hungary"],["CZE","Czech","Czech Republic"],["SVK","Slovak","Slovakia"],["ROU","Romanian","Romania"],["BGR","Bulgarian","Bulgaria"],["SRB","Serbian","Serbia"],
  ["HRV","Croatian","Croatia"],["UKR","Ukrainian","Ukraine"],["BLR","Belarusian","Belarus"],["LTU","Lithuanian","Lithuania"],["LVA","Latvian","Latvia"],["EST","Estonian","Estonia"],
  ["ALB","Albanian","Albania"],["BIH","Bosnian","Bosnia and Herzegovina"],["SVN","Slovenian","Slovenia"],["MKD","Macedonian","North Macedonia"],["MNE","Montenegrin","Montenegro"],
  ["MLT","Maltese","Malta"],["CYP","Cypriot","Cyprus"],["LUX","Luxembourgish","Luxembourg"],["NLD","Dutch","Netherlands"],["NOR","Norwegian","Norway"],["MDA","Moldovan","Moldova"],
  ["MNG","Mongolian","Mongolia"],["NPL","Nepalese","Nepal"],["PAK","Pakistani","Pakistan"],["BGD","Bangladeshi","Bangladesh"],["LKA","Sri Lankan","Sri Lanka"],["IRN","Iranian","Iran"],
  ["IRQ","Iraqi","Iraq"],["SYR","Syrian","Syria"],["LBN","Lebanese","Lebanon"],["ISR","Israeli","Israel"],["JOR","Jordanian","Jordan"],["SAU","Saudi Arabian","Saudi Arabia"],
  ["YEM","Yemeni","Yemen"],["OMN","Omani","Oman"],["KWT","Kuwaiti","Kuwait"],["QAT","Qatari","Qatar"],["BHR","Bahraini","Bahrain"],["ARE","Emirati","the United Arab Emirates"],
  ["KAZ","Kazakh","Kazakhstan"],["UZB","Uzbek","Uzbekistan"],["TKM","Turkmen","Turkmenistan"],["KGZ","Kyrgyz","Kyrgyzstan"],["TJK","Tajik","Tajikistan"],["GEO","Georgian","Georgia (country)"],
  ["ARM","Armenian","Armenia"],["AZE","Azerbaijani","Azerbaijan"],["LAO","Laotian","Laos"],["BRN","Bruneian","Brunei"],["BTN","Bhutanese","Bhutan"],["MDV","Maldivian","the Maldives"],
  ["PRK","North Korean","North Korea"],["KOR","Korean","Korea"],["PSE","Palestinian","Palestine"],["CHN","Chinese","China"],["JPN","Japanese","Japan"],["TWN","Taiwanese","Taiwan"],["KHM","Cambodian","Cambodia"],["MYS","Malaysian","Malaysia"],
  ["EGY","Egyptian","Egypt"],["LBY","Libyan","Libya"],["TUN","Tunisian","Tunisia"],["DZA","Algerian","Algeria"],["MAR","Moroccan","Morocco"],["MRT","Mauritanian","Mauritania"],
  ["MLI","Malian","Mali"],["NER","Nigerien","Niger"],["TCD","Chadian","Chad"],["SEN","Senegalese","Senegal"],["GMB","Gambian","the Gambia"],["GIN","Guinean","Guinea"],
  ["SLE","Sierra Leonean","Sierra Leone"],["LBR","Liberian","Liberia"],["CIV","Ivorian","Ivory Coast"],["BFA","Burkinabé","Burkina Faso"],["TGO","Togolese","Togo"],["BEN","Beninese","Benin"],
  ["NGA","Nigerian","Nigeria"],["CMR","Cameroonian","Cameroon"],["CAF","Central African","the Central African Republic"],["GAB","Gabonese","Gabon"],["COG","Congolese","the Republic of the Congo"],
  ["COD","Congolese","the Democratic Republic of the Congo"],["AGO","Angolan","Angola"],["ZMB","Zambian","Zambia"],["ZWE","Zimbabwean","Zimbabwe"],["MWI","Malawian","Malawi"],
  ["MOZ","Mozambican","Mozambique"],["NAM","Namibian","Namibia"],["LSO","Lesotho","Lesotho"],["SWZ","Swazi","Eswatini"],["MDG","Malagasy","Madagascar"],["MUS","Mauritian","Mauritius"],
  ["SOM","Somali","Somalia"],["DJI","Djiboutian","Djibouti"],["ERI","Eritrean","Eritrea"],["ETH","Ethiopian","Ethiopia"],["UGA","Ugandan","Uganda"],["SSD","South Sudanese","South Sudan"],
  ["CPV","Cape Verdean","Cape Verde"],["COM","Comorian","Comoros"],["SYC","Seychellois","Seychelles"],["GNB","Bissau-Guinean","Guinea-Bissau"],["GNQ","Equatoguinean","Equatorial Guinea"],
  ["CAN","Canadian","Canada"],["MEX","Mexican","Mexico"],["GTM","Guatemalan","Guatemala"],["BLZ","Belizean","Belize"],["HND","Honduran","Honduras"],["SLV","Salvadoran","El Salvador"],
  ["NIC","Nicaraguan","Nicaragua"],["CRI","Costa Rican","Costa Rica"],["PAN","Panamanian","Panama"],["CUB","Cuban","Cuba"],["HTI","Haitian","Haiti"],["DOM","Dominican Republic","the Dominican Republic"],
  ["JAM","Jamaican","Jamaica"],["PRI","Puerto Rican","Puerto Rico"],["COL","Colombian","Colombia"],["VEN","Venezuelan","Venezuela"],["ECU","Ecuadorian","Ecuador"],["PER","Peruvian","Peru"],
  ["BOL","Bolivian","Bolivia"],["CHL","Chilean","Chile"],["ARG","Argentine","Argentina"],["URY","Uruguayan","Uruguay"],["PRY","Paraguayan","Paraguay"],["BRA","Brazilian","Brazil"],
  ["GUY","Guyanese","Guyana"],["SUR","Surinamese","Suriname"],["TTO","Trinidad and Tobago","Trinidad and Tobago"],["BHS","Bahamian","the Bahamas"],
  ["NZL","New Zealand","New Zealand"],["FJI","Fijian","Fiji"],["PNG","Papua New Guinean","Papua New Guinea"],["WSM","Samoan","Samoa"],["TON","Tongan","Tonga"],["SLB","Solomon Islands","the Solomon Islands"],["VUT","Vanuatuan","Vanuatu"],
];
const titles = C.flatMap(([iso, adj, name]) => [[iso, `Timeline of ${adj} history`], [iso, `Timeline of ${name}`], [iso, `Timeline of the history of ${name}`]] as [string, string][]);
const found = new Map<string, string>();
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  const q = await api({ action: "query", titles: batch.map((b) => b[1]).join("|"), redirects: "1", prop: "info" }, "en.wikipedia.org");
  const redirect = new Map<string, string>((q.query.redirects ?? []).map((r: { from: string; to: string }) => [r.from, r.to]));
  const norm = new Map<string, string>((q.query.normalized ?? []).map((r: { from: string; to: string }) => [r.from, r.to]));
  const ok = new Set<string>(q.query.pages.filter((p: { missing?: boolean }) => !p.missing).map((p: { title: string }) => p.title));
  for (const [iso, t] of batch) {
    const n = norm.get(t) ?? t;
    const final = redirect.get(n) ?? n;
    if (ok.has(final) && /^Timeline/.test(final) && !found.has(`${iso}|${final}`)) found.set(`${iso}|${final}`, final);
  }
}
for (const key of found.keys()) {
  const [iso, title] = key.split("|");
  try {
    const page = await fetchPage(title, "en");
    const items = extractChronologyItems(page.html, "en");
    console.log(`PROBE ${iso}\t${title}\titems=${items.length}\tfirst=${items[0]?.text.slice(0, 14)}\tlast=${items.at(-1)?.text.slice(0, 14)}`);
  } catch (e) {
    console.log(`PROBE ${iso}\t${title}\tERROR ${e}`);
  }
  await new Promise((r) => setTimeout(r, 800));
}
console.log("PROBE DONE", found.size);
