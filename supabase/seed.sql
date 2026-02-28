-- JustMemo Ultimate Seed Data (2023-2026)
-- 统一测试口令: 'password123'

-- 确保 RLS 和加密扩展已就绪 (在迁移中已处理，此处仅作为种子逻辑)
-- TRUNCATE TABLE memos RESTART IDENTITY CASCADE;

INSERT INTO memos (content, tags, is_private, access_code, access_code_hint, created_at, word_count, is_pinned, pinned_at, locations)
VALUES 
-- [2023] 往事与起步
('2023 年的第一条记录。希望在这里能自由表达。 #你好2023 #启航', ARRAY['2023', '启航'], false, NULL, NULL, '2023-01-01 12:00:00+08', 25, false, NULL, NULL),
('北京的冬天真的很冷，但在故宫拍照很有氛围。 ![Forbidden City](https://images.unsplash.com/photo-1547984609-4b149f438f91?w=800) #北京 #冬', ARRAY['北京', '冬'], false, NULL, NULL, '2023-02-14 10:30:00+08', 35, false, NULL, '[{"name": "故宫博物院", "lat": 39.9163, "lng": 116.3972}]'::jsonb),
('开始学习 Next.js。 🔗 [Next.js 官方文档](https://nextjs.org/) #学习 #Nextjs', ARRAY['学习', 'Nextjs'], false, NULL, NULL, '2023-05-20 14:00:00+08', 30, false, NULL, NULL),
('这是一条加密的日记，记录了一些不愿公开的情绪。', ARRAY['私密', '心情'], true, crypt('password123', gen_salt('bf')), 'password123', '2023-09-09 23:30:00+08', 20, false, NULL, NULL),

-- [2024] 旅行与成长
('在东京塔下看夕阳。那一刻觉得世界好安静。 ![Tokyo Tower](https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800) #旅行 #东京', ARRAY['旅行', '东京'], false, NULL, NULL, '2024-03-15 17:45:00+08', 28, false, NULL, '[{"name": "东京塔", "lat": 35.6586, "lng": 139.7454}]'::jsonb),
('2024 年的财务规划。加密保存。', ARRAY['私密', '财务'], true, crypt('password123', gen_salt('bf')), 'password123', '2024-05-01 09:00:00+08', 15, false, NULL, NULL),
('这碗拉面真的绝了！推荐给所有人。 ![Ramen](https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800) #美食 #分享', ARRAY['美食', '分享'], false, NULL, NULL, '2024-07-04 12:30:00+08', 22, false, NULL, NULL),
('读完了《置身事内》，对中国经济逻辑有了新理解。 #读书 #笔记', ARRAY['读书', '笔记'], false, NULL, NULL, '2024-10-24 22:00:00+08', 45, false, NULL, NULL),

-- [2025] 突破与展望
('在纽约时代广场跨年，这种能量感太棒了！ ![Times Square](https://images.unsplash.com/photo-1543232147-3a1376915f01?w=800) #纽约 #跨年', ARRAY['纽约', '跨年'], false, NULL, NULL, '2025-01-01 00:05:00-05', 30, false, NULL, '[{"name": "时代广场", "lat": 40.7580, "lng": -73.9855}]'::jsonb),
('DeepSeek 真的火了，AI 的演进速度超乎想象。 🔗 [DeepSeek](https://www.deepseek.com/) #AI #DeepSeek', ARRAY['AI', 'DeepSeek'], false, NULL, NULL, '2025-02-15 09:15:00+08', 32, false, NULL, NULL),
('这是一组艺术灵感照片。 ![Art](https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800) #艺术 #灵感', ARRAY['艺术', '灵感'], false, NULL, NULL, '2025-05-18 15:40:00+08', 12, false, NULL, NULL),
('深夜碎碎念：偶尔也想逃离这一切。', ARRAY['情绪'], false, NULL, NULL, '2025-09-09 02:10:00+08', 18, false, NULL, NULL),

-- [2026] 现状与置顶
('【置顶公告】欢迎来到我的专属 B 言 B 语空间！🚀 这里记录了我所有的突发奇想和生活瞬间。', ARRAY['公告'], false, NULL, NULL, '2026-02-27 10:00:00+08', 40, true, now(), NULL),
('今天发现了一个超级好用的配色网站：🔗 [Huemint](https://huemint.com/) #设计 #配色', ARRAY['设计', '配色'], false, NULL, NULL, '2026-02-28 14:00:00+08', 24, false, NULL, NULL),
('测试多地联动：上午在深圳，下午在香港。 #双城 #生活', ARRAY['双城', '生活'], false, NULL, NULL, '2026-02-28 20:00:00+08', 25, false, NULL, '[{"name": "深圳湾", "lat": 22.4897, "lng": 113.9312}, {"name": "尖沙咀", "lat": 22.2936, "lng": 114.1722}]'::jsonb);

-- 填充热力图数据 (2023-2026 散落点)
INSERT INTO memos (content, tags, created_at, word_count)
SELECT 
  '自动填充的记录 ' || i,
  ARRAY['随机'],
  now() - (i * (random() * 5 + 1) || ' days')::interval,
  (random() * 50 + 5)::int
FROM generate_series(1, 150) s(i);
