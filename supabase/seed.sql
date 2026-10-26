-- 由 scripts/generate-seed.mts 產生，請勿手動修改
-- 只含來源目錄與示範事件（is_demo = true），不是正式歷史內容

insert into public.data_sources (id, title, author, url, license, version, retrieved_at, source_type, note) values
  ('historical-basemaps', 'Historical boundaries of world countries and cultural regions', 'André Ourednik 等貢獻者', 'https://github.com/aourednik/historical-basemaps', 'GPL-3.0', 'da7a4b735ecef70aebdc9c73e409d8a2500d50f3', '2026-10-26', 'dataset', '作者註明仍在開發中，學術使用前需與其他來源比對。只有年份快照，沒有逐筆引證與有效期間。'),
  ('natural-earth', 'Natural Earth 1:110m Admin 0 Countries', 'Natural Earth', 'https://www.naturalearthdata.com/', 'public-domain', 'ca96624a56bd078437bca8184e78163e5039ad19', null, 'dataset', '現代國界參考圖層')
on conflict (id) do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Great_Pyramid_of_Giza', 'Wikipedia: Great Pyramid of Giza', 'https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-great-pyramid', '胡夫金字塔完工', '古埃及第四王朝法老胡夫的陵墓，位於今埃及吉薩，一般認為約在西元前 2600 至前 2560 年間建成。', -2599, -2559, 9, 'circa', 'gregorian', null, null, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(31.134, 29.979), 4326), '吉薩（今埃及）', 'exact', 'culture', null, '胡夫金字塔', 'Great_Pyramid_of_Giza', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-great-pyramid', 'wikipedia-en:Great_Pyramid_of_Giza', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Code_of_Hammurabi', 'Wikipedia: Code of Hammurabi', 'https://en.wikipedia.org/wiki/Code_of_Hammurabi', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-code-of-hammurabi', '《漢摩拉比法典》頒布', '古巴比倫國王漢摩拉比頒布的法典，刻於石碑上，是現存最完整的古代法典之一，年代約在西元前 1755 至前 1750 年。', -1754, -1749, 9, 'circa', 'gregorian', null, null, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(44.421, 32.536), 4326), '巴比倫（今伊拉克）', 'approximate', 'politics', null, '漢摩拉比法典', 'Code_of_Hammurabi', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-code-of-hammurabi', 'wikipedia-en:Code_of_Hammurabi', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Battle_of_Marathon', 'Wikipedia: Battle of Marathon', 'https://en.wikipedia.org/wiki/Battle_of_Marathon', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-marathon', '馬拉松戰役', '雅典與普拉提亞聯軍在阿提卡的馬拉松平原擊退波斯帝國的軍隊，是第一次波希戰爭的關鍵戰役。', -489, -489, 9, 'exact', 'gregorian', null, null, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(23.978, 38.118), 4326), '馬拉松平原（今希臘）', 'exact', 'war', null, '馬拉松戰役', 'Battle_of_Marathon', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-marathon', 'wikipedia-en:Battle_of_Marathon', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Qin''s_wars_of_unification', 'Wikipedia: Qin''s wars of unification', 'https://en.wikipedia.org/wiki/Qin%27s_wars_of_unification', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-qin-unification', '秦統一六國', '秦王嬴政滅齊，完成統一，改稱「皇帝」，史稱秦始皇。', -220, -220, 9, 'exact', 'chinese_lunisolar', null, null, '秦王政二十六年', null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(108.71, 34.33), 4326), '咸陽（今中國陝西）', 'approximate', 'politics', null, '秦滅六國之戰', 'Qin''s_wars_of_unification', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-qin-unification', 'wikipedia-en:Qin''s_wars_of_unification', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Romulus_Augustulus', 'Wikipedia: Romulus Augustulus', 'https://en.wikipedia.org/wiki/Romulus_Augustulus', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-romulus-augustulus', '西羅馬末代皇帝被廢', '日耳曼將領奧多亞塞廢黜西羅馬皇帝羅慕路斯·奧古斯都，傳統上以這一年作為西羅馬帝國滅亡之年。', 476, 476, 9, 'exact', 'gregorian', null, null, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(12.204, 44.418), 4326), '拉溫納（今義大利）', 'exact', 'politics', null, null, 'Romulus_Augustulus', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-romulus-augustulus', 'wikipedia-en:Romulus_Augustulus', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Ming_treasure_voyages', 'Wikipedia: Ming treasure voyages', 'https://en.wikipedia.org/wiki/Ming_treasure_voyages', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-zheng-he-first-voyage', '鄭和第一次下西洋', '明成祖派遣鄭和率領大型船隊出航，經東南亞抵達印度西南岸的古里，1407 年返國。', 1405, 1405, 9, 'exact', 'chinese_lunisolar', null, null, '永樂三年', 1407, 1407, 9, 'exact', 'chinese_lunisolar', null, null, '永樂五年', extensions.st_setsrid(extensions.st_makepoint(121.25, 31.6), 4326), '劉家港（今中國江蘇太倉），船隊出發地', 'approximate', 'exploration', null, '鄭和下西洋', 'Ming_treasure_voyages', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-zheng-he-first-voyage', 'wikipedia-en:Ming_treasure_voyages', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Fall_of_Constantinople', 'Wikipedia: Fall of Constantinople', 'https://en.wikipedia.org/wiki/Fall_of_Constantinople', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-fall-of-constantinople', '君士坦丁堡陷落', '鄂圖曼帝國蘇丹穆罕默德二世攻陷拜占庭帝國首都君士坦丁堡，拜占庭帝國滅亡。', 1453, 1453, 11, 'exact', 'julian', 5, 29, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(28.98, 41.01), 4326), '君士坦丁堡（今土耳其伊斯坦堡）', 'exact', 'war', null, '君士坦丁堡陷落', 'Fall_of_Constantinople', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-fall-of-constantinople', 'wikipedia-en:Fall_of_Constantinople', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Voyages_of_Christopher_Columbus', 'Wikipedia: Voyages of Christopher Columbus', 'https://en.wikipedia.org/wiki/Voyages_of_Christopher_Columbus', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-columbus-landfall', '哥倫布首次抵達美洲', '哥倫布率領的西班牙船隊抵達巴哈馬群島的一座島嶼，開啟歐洲與美洲之間持續的接觸。確切登陸的島嶼至今仍有爭議。', 1492, 1492, 11, 'exact', 'julian', 10, 12, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(-74.53, 24.05), 4326), '巴哈馬群島（標記於聖薩爾瓦多島，登陸地點有爭議）', 'approximate', 'exploration', null, null, 'Voyages_of_Christopher_Columbus', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-columbus-landfall', 'wikipedia-en:Voyages_of_Christopher_Columbus', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;

insert into public.data_sources (id, title, url, license, source_type, note) values
  ('wikipedia-en:Assassination_of_Archduke_Franz_Ferdinand', 'Wikipedia: Assassination of Archduke Franz Ferdinand', 'https://en.wikipedia.org/wiki/Assassination_of_Archduke_Franz_Ferdinand', 'CC-BY-SA-4.0', 'encyclopedia', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict (id) do nothing;
insert into public.historical_events (id, title_zh_hant, summary_zh_hant, start_earliest, start_latest, start_precision, start_qualifier, start_calendar, start_month, start_day, start_original_text, end_earliest, end_latest, end_precision, end_qualifier, end_calendar, end_month, end_day, end_original_text, location, location_label, location_precision, category, wikidata_qid, wikipedia_zh_title, wikipedia_en_title, is_demo, review_status) values
  ('demo-sarajevo', '薩拉熱窩事件', '奧匈帝國皇儲法蘭茲·斐迪南大公夫婦在薩拉熱窩遇刺，成為第一次世界大戰爆發的導火線。', 1914, 1914, 11, 'exact', 'gregorian', 6, 28, null, null, null, null, null, null, null, null, null, extensions.st_setsrid(extensions.st_makepoint(18.428, 43.858), 4326), '薩拉熱窩（今波士尼亞與赫塞哥維納）', 'exact', 'politics', null, '薩拉熱窩事件', 'Assassination_of_Archduke_Franz_Ferdinand', true, 'unreviewed')
on conflict (id) do nothing;
insert into public.event_sources (event_id, source_id, supports, note) values
  ('demo-sarajevo', 'wikipedia-en:Assassination_of_Archduke_Franz_Ferdinand', 'overall', '示範用，開發環境無法連線至維基百科，尚未逐項核對')
on conflict do nothing;
