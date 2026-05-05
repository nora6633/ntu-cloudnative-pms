# Audit Log 筆記

接 Hibernate Envers，從零做到能在 DB 撈出「誰在什麼時候改了什麼」。下面是大致的脈絡跟 demo 怎麼跑。

## 做了什麼

- **PR #1** 主體（已 merge 進 `feature/evaluation`）
- **PR #11** 把 dependency 換成 `spring-data-envers`（已 merge）
- **PR #10** 補測試（review 中）

主體那條做的事：

- Entity 加 `@Audited`：`User`、`Evaluation`、`EvaluationItem`、`Goal`、`Progress`、`Template`、`Criterion` 七個。`Department` 跟 `Job` 不 audit，純查找用。
- `User.passwordHash` 標 `@NotAudited`，密碼不要留在歷史紀錄。
- 自訂 REVINFO（`CustomRevisionEntity`），原本只有 id + timestamp，加 `username` 跟 `ipAddress` 兩欄。
- `CustomRevisionListener`：登入者從 `SecurityContextHolder` 拿，IP 從 `RequestContextHolder` 拿（先看 `X-Forwarded-For`，沒有再用 `getRemoteAddr()`）。沒登入填 `system`，沒 request（背景 thread）填 `unknown`。
- `JwtAuthenticationFilter` principal 改用 username（之前是 user_id），這樣 `auth.getName()` 直接拿到帳號。

中間踩到三個雷：

1. `DefaultRevisionEntity` 在這版 Hibernate 是 `final`，extends 不能用，要自己宣告 `@RevisionNumber id` 跟 `@RevisionTimestamp timestamp`。
2. audited entity 連到非 audited entity（像 `User → Department`），envers 啟動時直接拒絕，要在 FK 加 `@Audited(targetAuditMode = NOT_AUDITED)`。
3. `@ElementCollection` 的 List（`template_criteria`、`goal_criteria`、`goal_progresses`）會撞 audit PK，要加 `@OrderColumn`。代價是這幾張表多一個 `position` 欄位，prod migration 記得補。

PR #11 是一行的事：把 `hibernate-envers` 換成 `spring-data-envers`。版本由 Spring Boot BOM 管，repository 之後可以直接 `extends RevisionRepository<T, ID, N>` 拿到 `findRevisions(id)` 之類的 API，不用自己 inject `AuditReader`。

PR #10 是測試。listener 那組 unit test 把所有分支跑過：登入 / 沒登入 / `anonymousUser` / `X-Forwarded-For` 多 IP / 沒 forwarded header / 沒 request context，共 6 個 case。Integration test 用 H2 + `TransactionTemplate` 真的觸發 envers commit，再用 `AuditReader` 驗：

- 存 user → 1 筆 revision
- `passwordHash` 用 `reader.find()` 撈出來是 null
- 改 user → 多 1 筆 revision
- 沒 auth context → REVINFO.username = `system`
- 有 auth context → REVINFO.username = 登入帳號

> 一開始想做 `@AfterEach` 清資料，但 DataSeeder 啟動時建的 Templates 連在 Jobs 上，FK violation 刪不掉。後來改成每個測試的 username 後綴 UUID，徹底避開撞名。

---

## Demo 流程

### 0. 環境

backend 在 devcontainer 裡跑，SQL Tools 連到 `pms-dev`（host `db`、db `pmsdb`、user `pmsuser` / `pmspassword`）。

### 1. 起 backend

```bash
cd backend
./mvnw spring-boot:run
```

看到 `Started PmsApplication` 就 OK。

### 2. 兩個視窗

| 視窗 | 內容 |
|---|---|
| 左 | `http://localhost:8080/api/swagger-ui/index.html` |
| 右 | VS Code SQL Tools |

### 3. 看初始狀態

```sql
SELECT id, username, ip_address FROM revinfo ORDER BY id DESC LIMIT 5;
```

幾筆 `username = system` / `ip_address = unknown`。DataSeeder 啟動時跑的，沒登入也沒 request，是正常的 fallback。

### 4. 登入 admin

swagger 找 `POST /auth/login`：

```json
{ "username": "admin", "password": "admin123" }
```

回 200 就 OK，cookie 已寫進瀏覽器。

### 5. 開一個 evaluation cycle

`POST /evaluations/start-cycle`：

```json
{
  "cycleName": "2026-demo",
  "evaluationType": "ANNUAL",
  "jobToTemplateIdMap": { "1": 1, "2": 2, "3": 3, "4": 4 }
}
```

### 6. 重跑 step 3 那條 SQL

最新幾筆 `username` 變 `admin`、`ip_address` 是 `127.0.0.1`。這就是 listener 從 SecurityContext + request 抓出來寫進去的。

### 7. 看實際的 audit row

```sql
SELECT rev, revtype, id, cycle, status, employee_id, supervisor_id
FROM evaluations_aud
ORDER BY rev DESC
LIMIT 10;
```

每對 employee + supervisor 一筆 evaluation，全部掛在剛才那個 rev 上，`revtype = 0`（INSERT）。

### 8. 證明密碼沒被 audit

```sql
DESCRIBE users_aud;
```

欄位列表沒 `password_hash`，`@NotAudited` 有效。

---

## 可能被問

**怎麼程式上查歷史？**
現在 `AuditReader.find(User.class, id, revisionNumber)`，`AuditLogIntegrationTest` 裡就有範例。之後 repository extends `RevisionRepository` 會更乾淨。

**效能影響？**
寫操作多一個 audit row 的 insert，影響不大；讀完全沒被 envers 攔。

**`position` 欄位是什麼？**
`@ElementCollection` 加 `@OrderColumn` 帶出來的，給 envers audit PK 用。三張子表 `template_criteria` / `goal_criteria` / `goal_progresses` 各多一欄。dev `ddl-auto=update` 會自動加，prod 要寫 migration。

---

## 表對照

| 業務表 | Audit 表 | 備註 |
|---|---|---|
| `users` | `users_aud` | 不含 `password_hash` |
| `evaluations` | `evaluations_aud` | |
| `evaluation_items` | `evaluation_items_aud` | |
| `goals` | `goals_aud` | |
| `goal_criteria` | `goal_criteria_aud` | 帶 `position` |
| `goal_progresses` | `goal_progresses_aud` | 帶 `position` |
| `templates` | `templates_aud` | |
| `template_criteria` | `template_criteria_aud` | 帶 `position` |
| `departments` | — | 不審計 |
| `jobs` | — | 不審計 |

`REVTYPE`：`0 = INSERT`、`1 = UPDATE`、`2 = DELETE`。

REVINFO 自訂版欄位：`id`（rev number）、`timestamp`、`username`、`ip_address`。
