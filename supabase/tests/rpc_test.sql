-- RPC 與 RLS 檢查。需先套用 migrations、seed.sql 與 data/raw/boundaries.sql。
-- 用法：psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rpc_test.sql
do $$
declare n int; y float8;
begin
  -- 1500 年剛好有快照
  select count(*), min(snapshot_year) into n, y from public.get_boundaries_at(1500);
  assert n > 0 and y = 1500, '1500 年應回傳 1500 年快照';

  -- 1446 年與 1400、1492 等距，取較早的 1400
  select min(snapshot_year) into y from public.get_boundaries_at(1446);
  assert y = 1400, '等距時應取較早的快照';

  -- 西元前 2500 年（天文年號 -2499）超出容許範圍，應為空（資料不足）
  select count(*) into n from public.get_boundaries_at(-2499);
  assert n = 0, '西元前 2500 年應無疆域資料';

  -- 事件：1405–1407 的跨年度事件在 1406 年可查到
  select count(*) into n from public.get_events_between(1406, 1406) where id = 'demo-zheng-he-first-voyage';
  assert n = 1, '跨年度事件應可在期間內查到';

  -- 所有 seed 事件都是示範資料且有來源
  select count(*) into n from public.historical_events where not is_demo;
  assert n = 0, 'seed 只能包含示範事件';
  select count(*) into n from public.historical_events e
    where not exists (select 1 from public.event_sources s where s.event_id = e.id);
  assert n = 0, '每個事件都必須有來源';

  raise notice 'RPC 檢查全部通過';
end $$;
