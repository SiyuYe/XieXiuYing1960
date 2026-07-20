#!/usr/bin/env python3
"""Acceptance test for V8.2 STEP 3 artwork sharing controls."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(text: str, needle: str, message: str) -> None:
    if needle not in text:
        raise AssertionError(message)


def main() -> None:
    template = (ROOT / "templates" / "artwork-page.html").read_text(encoding="utf-8")
    share_js = (ROOT / "artwork-share.js").read_text(encoding="utf-8")
    app_source = (ROOT / "src" / "app.source.js").read_text(encoding="utf-8")
    app_built = (ROOT / "app.js").read_text(encoding="utf-8")
    style = (ROOT / "style.css").read_text(encoding="utf-8")

    require(template, "← 返回作品集", "獨立作品頁缺少新版返回作品集文字")
    require(template, "🔍 在作品集卡片中查看", "獨立作品頁缺少新版作品集卡片文字")
    require(template, "data-share-artwork", "獨立作品頁缺少分享按鈕")
    require(template, "../artwork-share.js?v=8220", "獨立作品頁未載入分享流程")

    require(share_js, "navigator.share", "手機 Web Share API 未實作")
    require(share_js, "facebook.com/sharer/sharer.php", "桌機 Facebook 分享未實作")
    require(share_js, "social-plugins.line.me/lineit/share", "桌機 LINE 分享未實作")
    require(share_js, "twitter.com/intent/tweet", "桌機 X 分享未實作")
    require(share_js, "navigator.clipboard", "複製連結未實作")
    require(share_js, "Discord、Threads", "桌機其他平台提示缺失")

    for source, name in ((app_source, "src/app.source.js"), (app_built, "app.js")):
        require(source, "data-share-artwork", f"{name} 的作品大圖卡片缺少分享按鈕")
        require(source, "XxyArtworkShare", f"{name} 未綁定分享流程")
        require(source, "/works/", f"{name} 未使用獨立作品頁分享網址")

    require(style, ".artwork-share-backdrop", "桌機分享面板樣式缺失")
    require(style, ".artwork-share-toast", "複製成功提示樣式缺失")

    app_pages = ["index.html", "about.html", "gallery.html", "works.html", "exhibitions.html", "history.html", "contact.html"]
    for filename in app_pages:
        page = (ROOT / filename).read_text(encoding="utf-8")
        require(page, "artwork-share.js?v=8220", f"{filename} 未載入分享程式")
        require(page, "app.js?v=8220", f"{filename} 未更新 app.js 版本")

    print("STEP 3 分享流程自動化驗收全部通過")


if __name__ == "__main__":
    main()
