-- JustMemo Global Test Seed (2023-2026)
-- 统一测试口令: 'password123'
-- 目标：单一真理来源，幂等执行（UPSERT），全面覆盖功能点。

-- 0. [Users & Identities] 基础账号初始化
-- 管理员 (admin@example.com / admin123456)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@example.com', crypt('admin123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"admin"}', '{"name":"Admin User"}', now(), now(), 'authenticated', '', '', '', ''),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'user@example.com', crypt('user123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"user"}', '{"name":"Regular User"}', now(), now(), 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admin@example.com', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000001', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000002', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'user@example.com', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000002', now(), now(), now())
ON CONFLICT (provider, provider_id) DO NOTHING;

-- 1. [Pinned & Content] 置顶与核心公告 (使用固定 UUID 以保证幂等)
INSERT INTO memos (id, content, tags, is_private, is_pinned, pinned_at, created_at, word_count)
VALUES 
('11111111-1111-1111-1111-111111111111', '【全站置顶】欢迎来到 JustBB 2.0 极简版。这里是你逃离噪音的港湾。 🔗 [项目文档](https://github.com/) #公告 #置顶', ARRAY['公告', '置顶'], false, true, now(), now() - interval '1 hour', 45),
('11111111-1111-1111-1111-111111111112', '【置顶】这是较早的一条置顶，用于测试置顶项之间的二次排序逻辑。', ARRAY['公告'], false, true, now() - interval '1 day', now() - interval '2 days', 30),
('11111111-1111-1111-1111-111111111113', '这是一条展示 Markdown 功能的普通记录：\n- 任务一\n- 任务二\n- [ ] 待办事项', ARRAY['日常', 'Markdown'], false, false, NULL, now() - interval '3 hours', 20)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, tags = EXCLUDED.tags, is_pinned = EXCLUDED.is_pinned;

-- 2. [Multimedia & Locations] 富媒体与全球足迹
INSERT INTO memos (id, content, tags, locations, created_at, word_count)
VALUES 
('22222222-2222-2222-2222-222222222221', '这是一条带图的记录。 ![Nature](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800) #风景', ARRAY['风景'], NULL, '2023-05-12 10:00:00+08', 20),
('22222222-2222-2222-2222-222222222222', '在巴黎埃菲尔铁塔下。 ![Paris](https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800) #巴黎 #足迹', ARRAY['巴黎', '足迹'], '[{"name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945}]'::jsonb, '2023-10-01 20:00:00+08', 35),
('22222222-2222-2222-2222-222222222223', '成都漫游：下午在太古里。 #成都 #美食', ARRAY['成都', '美食'], '[{"name": "太古里", "lat": 30.6547, "lng": 104.0794}]'::jsonb, '2024-12-24 22:30:00+08', 25)
ON CONFLICT (id) DO NOTHING;

-- 3. [Privacy & Trash] 隐私口令与已删除记录
INSERT INTO memos (id, content, tags, is_private, access_code_hash, access_code_hint, created_at, word_count, deleted_at)
VALUES 
('33333333-3333-3333-3333-333333333331', '我的银行卡备忘：[此处已隐藏]。', ARRAY['私密'], true, crypt('password123', gen_salt('bf')), '我最常用的基础密码', '2024-01-01 00:01:00+08', 15, NULL),
('33333333-3333-3333-3333-333333333332', '这条记录已被删除，但在垃圾箱中可见。', ARRAY['垃圾箱'], false, NULL, NULL, '2025-12-31 23:59:59+08', 18, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 4. [Heatmap Burst] 大规模热力图生成 (使用确定性 UUID 确保幂等性)
-- 策略：生成 550 条记录，覆盖 2023-2026，频率随年份上升
INSERT INTO memos (id, content, tags, created_at, word_count)
SELECT 
  -- 使用 extensions.uuid_generate_v5(namespace, name) 生成基于索引的固定 UUID
  extensions.uuid_generate_v5('00000000-0000-0000-0000-000000000000', s.id::text),
  '自动生成的碎碎念 #' || s.id || '：' || (
    CASE (s.id % 5)
      WHEN 0 THEN '今天写了点代码。'
      WHEN 1 THEN '天气不错，适合散步。'
      WHEN 2 THEN '读了一本好书。'
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
  CASE 
    WHEN s.id < 50 THEN '2023-01-01'::timestamptz + (s.id * interval '7 days') + (random() * interval '2 days')
    WHEN s.id < 150 THEN '2024-01-01'::timestamptz + ((s.id - 50) * interval '2.5 days') + (random() * interval '1 day')
    WHEN s.id < 300 THEN '2025-01-01'::timestamptz + ((s.id - 150) * interval '1.1 days') + (random() * interval '12 hours')
    ELSE '2026-01-01'::timestamptz + ((s.id - 300) * interval '5 hours') + (random() * interval '2 hours')
  END,
  (random() * 100 + 5)::int
FROM generate_series(50, 550) AS s(id)
ON CONFLICT (id) DO NOTHING; -- 现在基于 ID 的冲突检测可以有效阻止重复
