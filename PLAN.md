# CamShare — 活動網站開發 Plan v2

## 專案概述
手機優先活動網站。使用者掃 QR Code → 輸入資訊 → 尋人啟事框架中拍照 → 生成個人化尋人啟事 → 分享。

## 技術棧
- HTML + CSS + JavaScript（純前端，無後端）
- Tailwind CSS（自行 build）
- Canvas API（照片合成）
- Web Share API（分享，iOS fallback 下載）
- MediaDevices API（相機存取）
- RWD：手機優先

## 檔案結構
```
camshare/
├── index.html
├── css/
│   └── style.css        # Tailwind output + 自訂樣式
├── js/
│   ├── app.js           # 流程控制、狀態管理、history API
│   ├── camera.js        # 相機存取、拍照、預覽、資源清理
│   └── composite.js     # Canvas 合成、下載、分享
├── assets/
│   ├── poster-frame.svg # 尋人啟事框架（挖空版）
│   └── poster-frame.png # 合成用框架（Canvas 用）
├── fonts/                # 中文字體（Canvas 繪製用）
└── README.md
```

## 頁面流程（SPA + history.pushState）

### Step 0：進入頁
- 活動標題 + 合成效果 mockup 預覽
- 開始按鈕

### Step 1：輸入資訊
- 名字（必填，text input，字數限制 20 字）
- 性別（選擇，radio/button group）
- 年齡（number input，範圍 1-120）
- 即時驗證，XSS 防護（textContent）

### Step 2：拍照
- getUserMedia 前鏡頭（facingMode: "user"）
- video playsinline + muted（iOS 必要）
- SVG 框架疊加 + 臉部引導（虛線框 + 提示文字）
- 拍照 → 暫停預覽 → 確認/重拍
- 離開時 track.stop() 清理資源
- 錯誤處理：權限被拒、不支援瀏覽器

### Step 3：生成結果
- Canvas 合成（1080x1920）
- 統一百分比座標對齊（SVG overlay = Canvas 合成）
- 字體預載（FontFace API）
- Loading spinner
- 重新開始 / 分享按鈕

### Step 4：分享
- Android Chrome：Web Share API 分享圖片（JPEG 0.85）
- iOS Safari：下載 fallback + 長按儲存提示
- WebView（LINE/FB）：偵測 + 下載 fallback

## 狀態管理
```javascript
const state = {
  currentStep: 0,
  userInfo: { name: '', gender: '', age: '' },
  photoData: null,
  compositeData: null,
};
```

## 瀏覽器返回鍵
- history.pushState 每個 step
- popstate 監聽返回
- 返回 = 回到上一步（Step 0 才真正離開）

## HTTPS 部署
- getUserMedia 需要 HTTPS
- QR Code 連結必須 https://
- 圖片資源必須同源

## RWD
- 手機優先，各比例對齊
- 框架挖空用百分比定位
- 合成輸出固定 1080x1920
- 直屏鎖定 + 旋轉提示

## 開發步驟
1. Phase 1：基本結構 + 流程切換 + 狀態管理 + 表單驗證
2. Phase 2：相機 + 拍照 + 錯誤處理 + SVG 疊加 + 臉部引導
3. Phase 3：合成 + 分享 + 字體預載 + Loading
4. Phase 4：打磨（動畫、旋轉提示、壓縮、分析）

## 模型分配
- Plan 審視 → Claude Opus ✅
- 前端實作 → Gemini 3.1 Pro (High)
- 非設計問題 → 節省模型

## 風格
- 明亮色調、資訊清楚
- 尋人啟事版型先簡潔版，等設計稿再調