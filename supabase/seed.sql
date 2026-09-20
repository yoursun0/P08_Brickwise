-- Seed demo project + units (local dev). Assumes a profile row exists for the demo user.
-- Run: insert the profile first (see README), then this file.

insert into public.projects (id, user_id, name, price_basis, price_columns)
values (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  '柏瓏 III（示範樓盤）',
  'lowest',
  '[{"key":"original","label":"原價"},{"key":"plan_a","label":"Plan A"},{"key":"plan_b","label":"Plan B"}]'::jsonb
)
on conflict (id) do nothing;

insert into public.documents (id, project_id, file_name, file_type, page_count, status, extraction_confidence)
values ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000100', 'price-list.pdf', 'pdf', 5, 'succeeded', 0.9)
on conflict (id) do nothing;

insert into public.units (
  id, project_id, source_document_id, tower, floor_raw, floor_sort_key, unit_no, layout,
  saleable_area_sqft, prices, price_original, price_plan_a, price_plan_b,
  computed_price, psf, tags, explainability, extraction_confidence
) values
('00000000-0000-0000-0000-00000000u01','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','18F',18,'A',null,512,'[{"key":"original","label":"原價","amount":9200000},{"key":"plan_a","label":"Plan A","amount":8620000},{"key":"plan_b","label":"Plan B","amount":8450000}]'::jsonb,9200000,8620000,8450000,8450000,16503.91,array['overpriced_high_floor'],'{"premium_pct":12.3,"threshold":10,"percentile":92,"comparison_basis":"全盤","prev_floor":"16F","prev_price":8450000,"this_price":8620000}',98),
('00000000-0000-0000-0000-00000000u02','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','16F',16,'B',null,512,'[{"key":"original","label":"原價","amount":9000000},{"key":"plan_a","label":"Plan A","amount":8450000},{"key":"plan_b","label":"Plan B","amount":8300000}]'::jsonb,9000000,8450000,8300000,8300000,16210.94,array[]::text[],'{}',82),
('00000000-0000-0000-0000-00000000u03','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','15F',15,'A',null,512,'[{"key":"original","label":"原價","amount":8950000},{"key":"plan_a","label":"Plan A","amount":8380000},{"key":"plan_b","label":"Plan B","amount":8220000}]'::jsonb,8950000,8380000,8220000,8220000,16054.69,array[]::text[],'{}',99),
('00000000-0000-0000-0000-00000000u04','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','12F',12,'C',null,512,'[{"key":"original","label":"原價","amount":8450000},{"key":"plan_a","label":"Plan A","amount":7920000},{"key":"plan_b","label":"Plan B","amount":7780000}]'::jsonb,8450000,7920000,7780000,7780000,15195.31,array[]::text[],'{}',71),
('00000000-0000-0000-0000-00000000u05','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','10F',10,'A',null,512,'[{"key":"original","label":"原價","amount":8300000},{"key":"plan_a","label":"Plan A","amount":7780000},{"key":"plan_b","label":"Plan B","amount":7650000}]'::jsonb,8300000,7780000,7650000,7650000,14941.41,array[]::text[],'{}',95),
('00000000-0000-0000-0000-00000000u06','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','8F',8,'B',null,512,'[{"key":"original","label":"原價","amount":8100000},{"key":"plan_a","label":"Plan A","amount":7580000},{"key":"plan_b","label":"Plan B","amount":7450000}]'::jsonb,8100000,7580000,7450000,7450000,14550.78,array[]::text[],'{}',90),
('00000000-0000-0000-0000-00000000u07','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','5F',5,'A',null,512,'[{"key":"original","label":"原價","amount":7900000},{"key":"plan_a","label":"Plan A","amount":7400000},{"key":"plan_b","label":"Plan B","amount":7280000}]'::jsonb,7900000,7400000,7280000,7280000,14218.75,array[]::text[],'{}',88),
('00000000-0000-0000-0000-00000000u08','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','3F',3,'C',null,512,'[{"key":"original","label":"原價","amount":7700000},{"key":"plan_a","label":"Plan A","amount":7200000},{"key":"plan_b","label":"Plan B","amount":7100000}]'::jsonb,7700000,7200000,7100000,7100000,13867.19,array[]::text[],'{}',80),
('00000000-0000-0000-0000-00000000u09','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','1F',1,'A',null,512,'[{"key":"original","label":"原價","amount":7600000},{"key":"plan_a","label":"Plan A","amount":7100000},{"key":"plan_b","label":"Plan B","amount":7000000}]'::jsonb,7600000,7100000,7000000,7000000,13671.88,array['lowest_floor'],'{}',76),
('00000000-0000-0000-0000-00000000u10','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','G/F',0,'B',null,512,'[{"key":"original","label":"原價","amount":7500000},{"key":"plan_a","label":"Plan A","amount":7000000},{"key":"plan_b","label":"Plan B","amount":6900000}]'::jsonb,7500000,7000000,6900000,6900000,13476.56,array['ground_floor','lowest_floor'],'{}',70)
on conflict (id) do nothing;
