-- 地球時光機：初始資料結構
-- 時間一律以「天文年號」(double precision) 儲存：西元 1 年 = 1、西元前 1 年 = 0、西元前 500 年 = -499。
-- 不精確的時間以 earliest / latest 表示可能範圍，並記錄精度、限定詞、原始曆法與原始文字。
-- 幾何一律為 WGS 84 (EPSG:4326)。事件與疆域分表存放，只透過 entity 間接關聯。

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- 列舉型別
-- ---------------------------------------------------------------------------
create type public.date_qualifier as enum ('exact', 'circa', 'not_before', 'not_after', 'disputed');
create type public.calendar_system as enum ('gregorian', 'julian', 'chinese_lunisolar', 'islamic', 'hebrew', 'other');
create type public.location_precision as enum ('exact', 'approximate', 'region');
create type public.review_status as enum ('unreviewed', 'reviewed');
create type public.source_type as enum ('academic', 'dataset', 'encyclopedia', 'demo');

-- ---------------------------------------------------------------------------
-- data_sources：共用的來源目錄（事件與疆域都引用）
-- ---------------------------------------------------------------------------
create table public.data_sources (
  id            text primary key,
  title         text not null,
  author        text,
  publisher     text,
  url           text,
  license       text not null,              -- SPDX 代碼，例如 GPL-3.0、CC0-1.0；公有領域用 'public-domain'
  version       text,                       -- 例如 git commit
  retrieved_at  date,
  source_type   public.source_type not null,
  note          text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- historical_entities：有疆域的主體（政權、帝國、部落、文化區…）
-- ---------------------------------------------------------------------------
create table public.historical_entities (
  id                    text primary key,
  name_zh_hant          text,               -- 尚未翻譯時為 null，不自行虛構譯名
  name_original         text not null,
  name_en               text,
  alt_names             jsonb not null default '[]'::jsonb,  -- [{ "name": "...", "lang": "...", "from": -220, "to": 206 }]
  entity_type           text not null default 'polity'
                        check (entity_type in ('polity', 'empire', 'dynasty', 'tribe', 'cultural_region', 'colony', 'other')),
  exists_from_earliest  double precision,
  exists_from_latest    double precision,
  exists_to_earliest    double precision,
  exists_to_latest      double precision,
  wikidata_qid          text check (wikidata_qid ~ '^Q[0-9]+$'),
  predecessor_ids       text[] not null default '{}',
  successor_ids         text[] not null default '{}',
  is_demo               boolean not null default false,
  created_at            timestamptz not null default now(),
  check (exists_from_earliest is null or exists_from_latest is null or exists_from_earliest <= exists_from_latest),
  check (exists_to_earliest is null or exists_to_latest is null or exists_to_earliest <= exists_to_latest)
);

-- ---------------------------------------------------------------------------
-- historical_boundaries：某主體在某段期間（或某個快照年份）的疆域
-- ---------------------------------------------------------------------------
create table public.historical_boundaries (
  id                   text primary key,
  entity_id            text references public.historical_entities (id) on delete cascade,  -- 來源未標示政權時為 null
  geom                 extensions.geometry (MultiPolygon, 4326) not null,
  -- 有效期間（不確定範圍）。只有快照的來源不填，改填 snapshot_year，不推測期間。
  valid_from_earliest  double precision,
  valid_from_latest    double precision,
  valid_to_earliest    double precision,
  valid_to_latest      double precision,
  snapshot_year        double precision,
  confidence           real not null check (confidence between 0 and 1),
  border_precision     smallint check (border_precision between 1 and 3),  -- 1 近似、2 中等、3 依國際法確定
  control_type         text not null default 'direct'
                       check (control_type in ('direct', 'vassal', 'sphere_of_influence', 'disputed', 'unknown')),
  name_in_source       text,
  subject_to           text,
  source_id            text not null references public.data_sources (id),
  source_feature_ref   text,
  license              text not null,
  is_demo              boolean not null default false,
  review_status        public.review_status not null default 'unreviewed',
  created_at           timestamptz not null default now(),
  -- 必須有快照年份或有效期間其中之一
  check (snapshot_year is not null or valid_from_earliest is not null),
  check (valid_from_earliest is null or valid_from_latest is null or valid_from_earliest <= valid_from_latest),
  check (valid_to_earliest is null or valid_to_latest is null or valid_to_earliest <= valid_to_latest),
  check (valid_from_latest is null or valid_to_earliest is null or valid_from_latest <= valid_to_earliest)
);

create index historical_boundaries_geom_idx on public.historical_boundaries using gist (geom);
create index historical_boundaries_snapshot_idx on public.historical_boundaries (source_id, snapshot_year);
create index historical_boundaries_valid_idx on public.historical_boundaries (valid_from_earliest, valid_to_latest);
create index historical_boundaries_entity_idx on public.historical_boundaries (entity_id);

-- ---------------------------------------------------------------------------
-- historical_events：事件
-- ---------------------------------------------------------------------------
create table public.historical_events (
  id                    text primary key,
  title_zh_hant         text not null,
  summary_zh_hant       text not null,
  -- 開始
  start_earliest        double precision not null,
  start_latest          double precision not null,
  start_precision       smallint not null check (start_precision between 0 and 11),  -- 與 Wikidata 精度代碼一致
  start_qualifier       public.date_qualifier not null default 'exact',
  start_calendar        public.calendar_system not null default 'gregorian',
  start_month           smallint check (start_month between 1 and 13),               -- 原始曆法的月（含閏月曆法）
  start_day             smallint check (start_day between 1 and 31),
  start_original_text   text,
  start_jdn             double precision,
  -- 結束（單一時間點事件為 null）
  end_earliest          double precision,
  end_latest            double precision,
  end_precision         smallint check (end_precision between 0 and 11),
  end_qualifier         public.date_qualifier,
  end_calendar          public.calendar_system,
  end_month             smallint check (end_month between 1 and 13),
  end_day               smallint check (end_day between 1 and 31),
  end_original_text     text,
  end_jdn               double precision,
  -- 地點
  location              extensions.geometry (Point, 4326) not null,
  location_area         extensions.geometry (MultiPolygon, 4326),
  location_label        text not null,
  location_precision    public.location_precision not null default 'exact',
  related_entity_ids    text[] not null default '{}',
  category              text not null check (category in ('politics', 'war', 'culture', 'exploration', 'science')),
  wikidata_qid          text check (wikidata_qid ~ '^Q[0-9]+$'),
  wikipedia_zh_title    text,
  wikipedia_en_title    text,
  is_demo               boolean not null default false,
  review_status         public.review_status not null default 'unreviewed',
  created_at            timestamptz not null default now(),
  check (start_earliest <= start_latest),
  check (end_earliest is null or end_latest is null or end_earliest <= end_latest),
  check (end_latest is null or start_earliest <= end_latest)
);

create index historical_events_time_idx on public.historical_events (start_earliest, end_latest);
create index historical_events_location_idx on public.historical_events using gist (location);

-- ---------------------------------------------------------------------------
-- event_sources：事件與來源（多對多）
-- ---------------------------------------------------------------------------
create table public.event_sources (
  event_id   text not null references public.historical_events (id) on delete cascade,
  source_id  text not null references public.data_sources (id),
  locator    text,     -- 頁碼、章節、條目名稱
  supports   text not null default 'overall' check (supports in ('date', 'location', 'overall')),
  note       text,
  primary key (event_id, source_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security：公開可讀；寫入只透過 service role（不受 RLS 限制）
-- ---------------------------------------------------------------------------
alter table public.data_sources enable row level security;
alter table public.historical_entities enable row level security;
alter table public.historical_boundaries enable row level security;
alter table public.historical_events enable row level security;
alter table public.event_sources enable row level security;

create policy "公開讀取" on public.data_sources for select to anon, authenticated using (true);
create policy "公開讀取" on public.historical_entities for select to anon, authenticated using (true);
create policy "公開讀取" on public.historical_boundaries for select to anon, authenticated using (true);
create policy "公開讀取" on public.historical_events for select to anon, authenticated using (true);
create policy "公開讀取" on public.event_sources for select to anon, authenticated using (true);
