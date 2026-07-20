# V8.2.0 STEP 1 — 獨立作品頁自動產生器（完整封版）

## 完成內容
- `scripts/generate_artwork_pages.py` 讀取正式 `data/site-data.json`。
- 使用單一模板 `templates/artwork-page.html` 自動建立 `works/<作品編號>.html`。
- 僅產生公開作品；非公開作品會略過。
- 公開作品缺少 ID、ID 含不安全字元或公開 ID 重複時，立即停止發布。
- 所有資料與模板先驗證、先完成記憶體渲染，成功後才更新現有頁面，避免失敗時破壞舊頁。
- 作品刪除或取消公開後，自動刪除帶有 Generator 標記的過期 HTML。
- 不會刪除 `works` 內人工建立且沒有 Generator 標記的 HTML。
- 自動建立 `data/artwork-pages.json`，記錄所有已產生頁面。
- GitHub Actions 每次發布 JSON 後自動執行 Generator，並將作品頁一起 commit、push。
- GitHub Actions 內加入 `scripts/test_generate_artwork_pages.py` 自動驗收。
- 完整 Log 顯示：輸入數、公開產生數、非公開略過數、新增或更新數、未變更數、刪除數與 Manifest 狀態。

## 自動化驗收範圍
- 公開作品會產生 HTML。
- 非公開作品不產生 HTML。
- 過期自動頁會刪除。
- 人工 HTML 不會被誤刪。
- 重複 ID 會中止，且不破壞原作品頁。
- Manifest 數量正確。

## 本機執行
```bash
python3 scripts/generate_artwork_pages.py data/site-data.json templates/artwork-page.html works --manifest data/artwork-pages.json
```

## 本機驗收
```bash
python3 scripts/test_generate_artwork_pages.py
```

## STEP 1 邊界
以下仍依原施工順序保留到後續 STEP，不提前加入：
- STEP 2：Open Graph、Twitter Card、JSON-LD、Canonical。
- STEP 3：分享按鈕與 Web Share API。
- STEP 4：正式上線後 Facebook、LINE、Discord、Google 外部平台驗收。
