-- JustMemo Global Test Seed (2023-2026)
-- 统一测试口令: 'password123'

-- 1. [Pinned & Important] 置顶与核心公告
INSERT INTO memos (content, tags, is_private, is_pinned, pinned_at, created_at, word_count)
VALUES 
('【全站置顶】欢迎来到 JustBB 2.0 极简版。这里是你逃离噪音的港湾。 🔗 [项目文档](https://github.com/) #公告 #置顶', ARRAY['公告', '置顶'], false, true, now(), now() - interval '1 hour', 45),
('【置顶】这是较早的一条置顶，用于测试置顶项之间的二次排序逻辑。', ARRAY['公告'], false, true, now() - interval '1 day', now() - interval '2 days', 30);

-- 2. [Multimedia] 富媒体与 Markdown 极限测试
INSERT INTO memos (content, tags, created_at, word_count)
VALUES 
('这是一条带图的记录。 ![Nature](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800) #风景 #摄影', ARRAY['风景', '摄影'], '2023-05-12 10:00:00+08', 20),
('多图展示测试：\n![City](https://images.unsplash.com/photo-1449156003053-c306a0482905?w=800)\n![People](https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800)\n#旅行 #城市', ARRAY['旅行', '城市'], '2024-06-15 14:20:00+08', 25),
('代码块高亮测试：\n```tsx\nexport default function Hello() {\n  return <div>Hello JustBB!</div>\n}\n```\n#代码 #前端', ARRAY['代码', '前端'], '2025-01-20 09:15:00+08', 40),
('超长文本测试：' || repeat('这是一段测试文本。', 50), ARRAY['测试', '长文'], '2025-08-08 18:00:00+08', 500);

-- 3. [Locations] 全球足迹 (单点 & 多点)
INSERT INTO memos (content, tags, locations, created_at, word_count)
VALUES 
('在巴黎埃菲尔铁塔下，浪漫确实是有形状的。 ![Paris](https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800) #巴黎 #足迹', ARRAY['巴黎', '足迹'], '[{"name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945}]'::jsonb, '2023-10-01 20:00:00+08', 35),
('成都漫游：上午在太古里，下午在宽窄巷子，晚上在九眼桥。 #成都 #美食', ARRAY['成都', '美食'], '[{"name": "太古里", "lat": 30.6547, "lng": 104.0794}, {"name": "宽窄巷子", "lat": 30.6635, "lng": 104.0531}, {"name": "九眼桥", "lat": 30.6436, "lng": 104.0841}]'::jsonb, '2024-12-24 22:30:00+08', 42),
('上海武康路，梧桐树下的老建筑非常有味道。 #上海 #CityWalk', ARRAY['上海', 'CityWalk'], '[{"name": "武康大楼", "lat": 31.2052, "lng": 121.4357}]'::jsonb, '2026-02-20 16:00:00+08', 28);

-- 4. [Privacy] 隐私与口令极限测试
INSERT INTO memos (content, tags, is_private, access_code_hash, access_code_hint, created_at, word_count)
VALUES 
('我的银行卡备忘：[此处已隐藏]。', ARRAY['私密', '安全'], true, crypt('password123', gen_salt('bf')), '我最常用的基础密码', '2024-01-01 00:01:00+08', 15),
('明年一定要去大理开个民宿。这是具体的预算清单：1. 租金... 2. 装修...', ARRAY['私密', '梦想'], true, crypt('password123', gen_salt('bf')), 'password123', '2025-03-12 11:00:00+08', 50),
('没有任何提示词的隐私记录。', ARRAY['私密'], true, crypt('password123', gen_salt('bf')), NULL, '2026-01-15 15:00:00+08', 12);

-- 5. [Trash] 软删除记录 (用于测试垃圾箱)
INSERT INTO memos (content, tags, deleted_at, created_at, word_count)
VALUES 
('这条记录已被删除，但在垃圾箱中可见。', ARRAY['垃圾箱'], now() - interval '1 day', '2025-12-31 23:59:59+08', 18);

-- 6. [References] 引用关系测试
INSERT INTO memos (content, tags, created_at, word_count)
VALUES 
('关于我在 @1 中提到的计划，现在有了新进展。 #计划 #联动', ARRAY['计划'], '2026-02-28 10:00:00+08', 22);

-- 7. [Heatmap Burst] 大规模热力图数据生成 (300+ 记录)
-- 策略：2023 年少量，2024 年稳步增长，2025 年高频，2026 年爆发
INSERT INTO memos (content, tags, created_at, word_count)
SELECT 
  '自动生成的碎碎念 #' || s.id || '：' || (
    CASE (s.id % 5)
      WHEN 0 THEN '今天写了点代码。'
      WHEN 1 THEN '天气不错，适合散步。'
      WHEN 2 THEN '读了一本好书，感触颇多。'
      WHEN 3 THEN '发现了一个有趣的网站。'
      ELSE '这是一条普通的记录。'
    END
  ),
  ARRAY[
    CASE (s.id % 7)
      WHEN 0 THEN '技术' WHEN 1 THEN '生活' WHEN 2 THEN '随笔' 
      WHEN 3 THEN '思考' WHEN 4 THEN '日常' WHEN 5 THEN '读书' 
      ELSE '灵感'
    END
  ],
  -- 模拟非均匀时间分布
  CASE 
    WHEN s.id < 50 THEN '2023-01-01'::timestamptz + (s.id * interval '7 days') + (random() * interval '2 days')
    WHEN s.id < 150 THEN '2024-01-01'::timestamptz + ((s.id - 50) * interval '2.5 days') + (random() * interval '1 day')
    WHEN s.id < 250 THEN '2025-01-01'::timestamptz + ((s.id - 150) * interval '1.2 days') + (random() * interval '12 hours')
    ELSE '2026-01-01'::timestamptz + ((s.id - 250) * interval '6 hours') + (random() * interval '2 hours')
  END,
  (random() * 100 + 5)::int
FROM generate_series(1, 350) AS s(id);

-- 8. [Heatmap Patch] 补齐特定日期的爆发力 (如：每个周一都记录)
INSERT INTO memos (content, tags, created_at, word_count)
SELECT 
  '周一例行记录',
  ARRAY['例行'],
  d,
  (random() * 20 + 10)::int
FROM generate_series('2025-01-01'::timestamp, '2026-02-28'::timestamp, '1 week') AS d;
