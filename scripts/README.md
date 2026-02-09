# Scripts Directory

This directory contains utility scripts for database management, testing, and maintenance.

## Prerequisites

Before running the test scripts, ensure that:

1.  Node.js and npm are installed.
2.  The `.env.local` file in the project root is configured with the correct Supabase credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (only for test-rls.ts)
    ```

---

## 1. Database Functions (SQL Scripts)

These `.sql` files define Remote Procedure Call (RPC) functions in Supabase.

| Filename | Description |
| --- | --- |
| `rpc-search-memos.sql` | **Core Search Function** (`search_memos_secure`). Handles keyword search, tag filtering, date filtering, permission control (private/public), and sorting logic. |
| `rpc-get-timeline.sql` | **Timeline Stats Function** (`get_timeline_stats`). A lightweight function that quickly returns the daily count of memos, used for rendering heatmaps or timelines. |

### How to Deploy

These scripts **cannot** be run directly in the local terminal. To deploy them:

1.  Open the script file and copy all SQL content.
2.  Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
3.  Go to the **SQL Editor** of your project.
4.  Paste the code and click **Run**.
5.  If the function already exists, the script usually uses `CREATE OR REPLACE FUNCTION`, which will automatically update the logic.

---

## 2. Test Scripts (TypeScript Scripts)

These `.ts` files are used to verify database logic locally.

| Filename | Description |
| --- | --- |
| `test-date-filter.ts` | **Date Filter Test**. Verifies that `search_memos_secure` correctly filters memos for a specific date. |
| `test-rls.ts` | **Security Test (RLS)**. Simulates anonymous users and admins to verify that private memos are correctly hidden and can only be accessed with the correct token. |

### How to Use & Test

Run the scripts directly using `npx ts-node`.

#### Run Date Filter Test
```bash
# Ensure environment variables are loaded (if using dotenv-cli)
npx dotenv -e .env.local -- npx ts-node scripts/test-date-filter.ts

# Or, if your environment is already configured
npx ts-node scripts/test-date-filter.ts
```
*Expected Result*: The script outputs the number of found memos and verifies if their `created_at` matches the target date.

#### Run Security Test
```bash
npx dotenv -e .env.local -- npx ts-node scripts/test-rls.ts
```
*Expected Result*:
1.  Creates a private test memo.
2.  Attempts to read with an anonymous client -> **Should fail / return empty** (PASS).
3.  Attempts to read with RPC -> **Should be marked as Locked or have empty content** (PASS).
4.  Automatically deletes the test data.

---

## Common Issues

*   **Error: "relation 'memos' does not exist"**
    *   Check if your `.env.local` is connecting to the correct Supabase project.
*   **Error: "function search_memos_secure does not exist"**
    *   This indicates you haven't run `rpc-search-memos.sql` in the Supabase SQL Editor to deploy the function yet.
