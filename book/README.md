# 『歩きながら、話すだけ。』電子書籍 制作ファイル

荒川理 著『歩きながら、話すだけ。――パソコンを閉じて「脳みそ」を売る、ミーティング男の働き方』の原稿・ビルドスクリプト・成果物一式です。

## すぐ使うもの（KDPにアップロードするだけ）

| ファイル | 用途 |
|---|---|
| `dist/arukinagara-hanasudake.epub` | KDP「電子書籍の原稿」にアップロードする EPUB3（epubcheck 検証済み） |
| `dist/cover.jpg` | KDP「Kindle 本の表紙」にアップロードする表紙（1600×2560px JPEG） |
| `KDP_METADATA.md` | KDP 登録画面に転記する書誌情報・説明文・キーワード・カテゴリー・価格の推奨値 |
| `AUTHOR_CHECKLIST.md` | 出版前に著者本人が確認する事項（実名掲載の可否、エピソードの事実確認など） |

## 中身

- `manuscript/` … 本文（Markdown、章ごと）と `book.json`（書誌情報・章の並び）
- `plan/` … 編集ブリーフ、最終企画書、文体ルール、根拠ファクト（出典付き）
- `build/` … EPUB ビルダー、表紙レンダラー、原稿リンター

## 本文を直したあとの再ビルド

```bash
# 依存: Python 3.11+, Java（epubcheck 用）, Node 22 + playwright + Chromium（表紙の再描画時のみ）
python3 book/build/lint_manuscript.py book/manuscript          # 禁止語・文字数・構造チェック
python3 book/build/build_epub.py book/manuscript book/dist/arukinagara-hanasudake.epub --cover book/dist/cover.jpg
java -jar epubcheck.jar book/dist/arukinagara-hanasudake.epub  # https://github.com/w3c/epubcheck/releases
```

表紙を直す場合は `build/cover.html` を編集して `node book/build/render_cover.js book/build/cover.html book/dist/cover.jpg`。
フォントは Noto Sans JP / Noto Serif JP（SIL Open Font License）。リポジトリには含めていないので、表紙を再描画する前に `bash book/build/fetch_fonts.sh` でリポジトリ直下の `fonts/` に取得してください。

## 原稿の書き方（Markdown の約束）

- 1行目 `# 章タイトル`（「第N章」は付けない。ビルド時に自動で付く）
- `## 見出し`、`### 小見出し`
- 段落は空行で区切る。段落内の改行は連結される
- `- ` 箇条書き、`> ` 引用、`**太字**`、`---` で場面転換（＊＊＊）
- 章末の「今日からできること」は次の形

```
:::box 今日からできること
- やること1
- やること2
:::
```
