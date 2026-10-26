-- 依年份查詢疆域與事件的 RPC。皆為 security invoker，遵守 RLS。

-- 某來源有哪些快照年份（供前端建立時間索引）
create or replace function public.get_boundary_snapshots()
returns table (source_id text, snapshot_year double precision, feature_count bigint)
language sql stable security invoker
set search_path = public
as $$
  select b.source_id, b.snapshot_year, count(*)
  from public.historical_boundaries b
  where b.snapshot_year is not null
  group by b.source_id, b.snapshot_year
  order by b.snapshot_year;
$$;

-- 某年份的疆域。
--   certainty = 'certain'   ：年份落在確定有效期間內
--               'uncertain' ：年份只落在不確定範圍內（前端以虛線、較淡顯示）
--               'snapshot'  ：只有快照的來源，取與年份最接近且相差不超過 p_tolerance 年的快照
-- 距離相同時取較早的快照，不以「未來」的疆域代表過去。沒有符合的資料就回傳空集合（前端顯示資料不足）。
create or replace function public.get_boundaries_at(p_year double precision, p_tolerance double precision default 50)
returns table (
  id text,
  entity_id text,
  name_in_source text,
  subject_to text,
  border_precision smallint,
  confidence real,
  control_type text,
  snapshot_year double precision,
  certainty text,
  source_id text,
  license text,
  is_demo boolean,
  geometry jsonb
)
language sql stable security invoker
set search_path = public, extensions
as $$
  with ranged as (
    select b.*,
           case when b.valid_from_latest <= p_year and p_year <= coalesce(b.valid_to_earliest, 'infinity'::float8)
                then 'certain' else 'uncertain' end as certainty
    from public.historical_boundaries b
    where b.snapshot_year is null
      and b.valid_from_earliest <= p_year
      and p_year <= coalesce(b.valid_to_latest, 'infinity'::float8)
  ),
  nearest as (
    select distinct on (b.source_id) b.source_id, b.snapshot_year
    from public.historical_boundaries b
    where b.snapshot_year is not null and abs(b.snapshot_year - p_year) <= p_tolerance
    order by b.source_id, abs(b.snapshot_year - p_year), b.snapshot_year
  ),
  snap as (
    select b.*, 'snapshot'::text as certainty
    from public.historical_boundaries b
    join nearest n on n.source_id = b.source_id and n.snapshot_year = b.snapshot_year
  ),
  combined as (
    select * from ranged
    union all
    select * from snap
  )
  select c.id, c.entity_id, c.name_in_source, c.subject_to, c.border_precision, c.confidence, c.control_type,
         c.snapshot_year, c.certainty, c.source_id, c.license, c.is_demo,
         st_asgeojson(c.geom, 5)::jsonb
  from combined c
  order by c.id;  -- 固定排序，前端可分頁取回（PostgREST 預設每次最多 1000 列）
$$;

-- 與年份區間 [p_from, p_to] 有交集的事件，附來源清單
create or replace function public.get_events_between(p_from double precision, p_to double precision)
returns table (
  id text,
  title_zh_hant text,
  summary_zh_hant text,
  start_earliest double precision,
  start_latest double precision,
  start_precision smallint,
  start_qualifier public.date_qualifier,
  start_calendar public.calendar_system,
  start_month smallint,
  start_day smallint,
  start_original_text text,
  end_earliest double precision,
  end_latest double precision,
  end_precision smallint,
  end_qualifier public.date_qualifier,
  end_calendar public.calendar_system,
  end_month smallint,
  end_day smallint,
  end_original_text text,
  lat double precision,
  lon double precision,
  location_label text,
  location_precision public.location_precision,
  category text,
  wikidata_qid text,
  wikipedia_zh_title text,
  wikipedia_en_title text,
  is_demo boolean,
  review_status public.review_status,
  sources jsonb
)
language sql stable security invoker
set search_path = public, extensions
as $$
  select e.id, e.title_zh_hant, e.summary_zh_hant,
         e.start_earliest, e.start_latest, e.start_precision, e.start_qualifier, e.start_calendar,
         e.start_month, e.start_day, e.start_original_text,
         e.end_earliest, e.end_latest, e.end_precision, e.end_qualifier, e.end_calendar,
         e.end_month, e.end_day, e.end_original_text,
         st_y(e.location), st_x(e.location), e.location_label, e.location_precision, e.category,
         e.wikidata_qid, e.wikipedia_zh_title, e.wikipedia_en_title, e.is_demo, e.review_status,
         coalesce(
           (select jsonb_agg(jsonb_build_object(
                     'title', s.title, 'url', s.url, 'supports', es.supports, 'note', es.note)
                   order by s.id)
            from public.event_sources es join public.data_sources s on s.id = es.source_id
            where es.event_id = e.id),
           '[]'::jsonb)
  from public.historical_events e
  where e.start_earliest <= p_to
    and coalesce(e.end_latest, e.start_latest) >= p_from
  order by e.start_earliest;
$$;

grant execute on function public.get_boundary_snapshots() to anon, authenticated;
grant execute on function public.get_boundaries_at(double precision, double precision) to anon, authenticated;
grant execute on function public.get_events_between(double precision, double precision) to anon, authenticated;
