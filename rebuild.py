import re
import os

html_content = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CamShare — 拍下你的尋人啟事</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="theme-aurora app-body">

  <div id="landscape-overlay" class="landscape-overlay">
    <svg class="landscape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="7" width="16" height="10" rx="2" transform="rotate(-90 12 12)"/>
      <line x1="12" y1="17" x2="12" y2="17.01"/>
    </svg>
    <p class="landscape-text">請將手機轉為直屏使用</p>
    <p class="landscape-subtext">此活動頁面僅支援直屏模式</p>
  </div>

  <div id="app" class="app-container">

    <div class="step-indicator-container">
      <div class="step-indicator-item active" id="step-dot-0">
        <div class="step-indicator-dot">1</div>
        <span class="step-indicator-label">首頁</span>
      </div>
      <div class="step-indicator-line"><div class="step-indicator-line-fill" id="step-line-0"></div></div>
      <div class="step-indicator-item" id="step-dot-1">
        <div class="step-indicator-dot">2</div>
        <span class="step-indicator-label">資訊</span>
      </div>
      <div class="step-indicator-line"><div class="step-indicator-line-fill" id="step-line-1"></div></div>
      <div class="step-indicator-item" id="step-dot-2">
        <div class="step-indicator-dot">3</div>
        <span class="step-indicator-label">拍照</span>
      </div>
      <div class="step-indicator-line"><div class="step-indicator-line-fill" id="step-line-2"></div></div>
      <div class="step-indicator-item" id="step-dot-3">
        <div class="step-indicator-dot">4</div>
        <span class="step-indicator-label">分享</span>
      </div>
    </div>

    <section id="step-0" class="step-section active">
      <div class="step-body content-center text-center">
        <h1 class="title-main">CamShare</h1>
        <p class="title-sub">專屬於你的復古懸賞海報</p>

        <div class="mockup-preview-wrap">
          <div class="mockup-preview">
            <div class="mockup-overlay-gradient"></div>
            
            <div class="camera-focus-corner corner-tl opacity-60"></div>
            <div class="camera-focus-corner corner-tr opacity-60"></div>
            <div class="camera-focus-corner corner-bl opacity-60"></div>
            <div class="camera-focus-corner corner-br opacity-60"></div>

            <div class="mockup-preview-content">
              <svg class="mockup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="mockup-title">WANTED POSTER PREVIEW</p>
              <p class="mockup-subtext">點擊開始製作</p>
            </div>
          </div>
        </div>
      </div>
      <div class="step-footer">
        <button id="btn-start" class="btn-primary-new">開始製作</button>
      </div>
    </section>

    <section id="step-1" class="step-section">
      <div class="step-body">
        <h2 class="section-title">填寫懸賞資訊</h2>

        <div class="form-group w-full">
          <label for="input-name" class="form-label">名字 / 代號 <span class="text-danger">*</span></label>
          <input type="text" id="input-name" maxlength="20" required placeholder="請輸入名字或暱稱" class="input-field-new">
          <p id="name-error" class="error-msg" style="display:none;">⚠️ 請輸入名字以進行下一步</p>
        </div>

        <div class="form-group w-full">
          <label class="form-label">性別</label>
          <div id="gender-group" class="gender-btn-group">
            <button type="button" data-gender="男" class="gender-btn-new">👨 男</button>
            <button type="button" data-gender="女" class="gender-btn-new">👩 女</button>
            <button type="button" data-gender="不指定" class="gender-btn-new">🌀 不指定</button>
          </div>
        </div>

        <div class="form-group w-full">
          <label class="form-label">年齡</label>
          <input type="number" id="input-age" min="1" max="120" placeholder="請輸入年齡" class="input-field-new">
        </div>
      </div>
      <div class="step-footer">
        <button id="btn-next-step2" class="btn-primary-new" disabled>下一步：準備拍照</button>
      </div>
    </section>

    <section id="step-2" class="step-section">
      <div class="step-body">
        <h2 class="section-title">擺出你的最佳表情</h2>

        <div id="camera-container" class="camera-container">
          <div class="camera-focus-corner corner-tl"></div>
          <div class="camera-focus-corner corner-tr"></div>
          <div class="camera-focus-corner corner-bl"></div>
          <div class="camera-focus-corner corner-br"></div>

          <div id="camera-loading" class="camera-loading" style="display:none;">
            <div class="camera-focus-target"></div>
            <div class="camera-spinner"></div>
            <p class="loading-text">正在啟動與對焦相機…</p>
          </div>

          <div id="camera-error" class="camera-error" style="display:none;">
            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p class="error-title"></p>
            <p class="error-body"></p>
          </div>

          <video id="camera-video" class="camera-video" playsinline muted autoplay></video>

          <div id="poster-overlay" class="poster-overlay" style="display:none;">
            <svg class="poster-overlay-svg" viewBox="0 0 360 480" preserveAspectRatio="xMidYMid meet">
              <rect x="0" y="0" width="360" height="90" fill="#111827" opacity="0.8"/>
              <text x="180" y="60" text-anchor="middle" font-size="30" font-weight="900" fill="#ffffff" font-family="'Noto Sans TC', sans-serif" letter-spacing="8">WANTED</text>
              <path d="M 38 140 L 22 140 L 22 320 L 38 320" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
              <path d="M 322 140 L 338 140 L 338 320 L 322 320" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
              <rect x="0" y="365" width="360" height="115" fill="#111827" opacity="0.8"/>
              <text x="180" y="405" text-anchor="middle" font-size="14" fill="#e2e8f0" font-family="'Noto Sans TC', sans-serif" opacity="0.9">
                <tspan x="180" font-weight="700">姓名：_____________</tspan>
                <tspan x="180" dy="24" font-weight="700">性別：_____　年齡：_____</tspan>
              </text>
              <circle cx="165" cy="462" r="3" fill="#ffffff" opacity="0.4"/>
              <circle cx="180" cy="462" r="3" fill="#60a5fa" opacity="0.8"/>
              <circle cx="195" cy="462" r="3" fill="#ffffff" opacity="0.4"/>
            </svg>
          </div>

          <div id="face-guide" class="face-guide" style="display:none;">
            <div class="face-guide-oval"></div>
            <p class="face-guide-text">對齊臉部</p>
          </div>

          <div id="photo-preview" class="photo-preview" style="display:none;">
            <img src="" alt="預覽照片" />
          </div>
        </div>
      </div>

      <div class="step-footer">
        <div id="capture-btn-wrap" class="capture-btn-wrap">
          <button id="btn-capture" class="btn-capture" style="display:none;">
            <svg class="capture-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>

        <div id="preview-btn-wrap" class="preview-btn-wrap action-buttons" style="display:none;">
          <button id="btn-retake" class="btn-secondary-new">重新拍攝</button>
          <button id="btn-confirm" class="btn-primary-new">確認使用</button>
        </div>
      </div>
    </section>

    <section id="step-3" class="step-section">
      <div class="step-body">
        <h2 class="section-title">生成結果</h2>

        <div class="composite-area">
          <div id="composite-loading" class="composite-loading">
            <div class="composite-spinner"></div>
            <p class="developing-text">相片顯影中 (Developing)...</p>
            <div class="developing-progress-bar">
              <div id="developing-progress-fill" class="developing-progress-fill"></div>
            </div>
            <p class="loading-percentage-text">0%</p>
          </div>

          <div class="poster-3d-wrap" id="composite-img-wrap" style="display:none;">
            <div class="poster-3d-card" id="composite-img-card">
              <img id="composite-img" src="" alt="你的尋人啟事" class="composite-developing-img" />
              <div class="poster-3d-sheen"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="step-footer action-buttons">
        <button id="btn-restart" class="btn-secondary-new">重新製作</button>
        <button id="btn-share" class="btn-primary-new" disabled>下一步：去分享</button>
      </div>
    </section>

    <section id="step-4" class="step-section">
      <div class="step-body">
        <h2 class="section-title">分享與儲存</h2>

        <div class="poster-3d-wrap share-wrap">
          <div class="poster-3d-card" id="share-img-card">
            <img id="share-img" src="" alt="你的尋人啟事" class="final-result-img" />
            <div class="poster-3d-sheen"></div>
          </div>
        </div>
      </div>

      <div class="step-footer">
        <div class="share-actions">
          <button id="btn-web-share" class="btn-primary-new" style="display:none;">
            <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            分享海報
          </button>

          <button id="btn-download" class="btn-secondary-new">
            <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            下載高清海報
          </button>
        </div>

        <p id="share-hint" class="share-hint" style="display:none;">
          💡 提示：長按上方海報，即可儲存至手機相簿
        </p>

        <button id="btn-restart-final" class="btn-secondary-new mt-sm">重新製作</button>
      </div>
    </section>

  </div>

  <script src="js/camera.js"></script>
  <script src="js/composite.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
"""

css_insert = """
:root {
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-900: #0f172a;
  --slate-950: #020617;
  
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --indigo-400: #818cf8;
  --indigo-950: #1e1b4b;
  
  --red-400: #f87171;
  --red-500: #ef4444;

  --font-sans: 'Outfit', 'Noto Sans TC', sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app-body {
  background-color: var(--slate-900);
  color: var(--slate-200);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  position: relative;
}

.text-danger { color: var(--red-400); }
.mt-sm { margin-top: 0.75rem; }
.w-full { width: 100%; }

.app-container {
  width: 100%;
  max-width: 448px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
  position: relative;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step-section {
  display: none;
  opacity: 0;
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  transition: opacity 0.3s;
}

.step-section.active {
  display: flex !important;
  opacity: 1;
}

.step-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}
.step-body.content-center {
  justify-content: center;
}
.text-center { text-align: center; }

.step-footer {
  flex: 0 0 auto;
  padding-top: 0.75rem;
  width: 100%;
}

.title-main {
  font-size: 2.25rem;
  font-weight: 900;
  background: linear-gradient(to right, var(--blue-400), var(--indigo-400));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.025em;
  margin-bottom: 0.25rem;
}
.title-sub {
  font-size: 0.75rem;
  color: var(--slate-400);
  letter-spacing: 0.025em;
  margin-bottom: 1.5rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slate-100);
  margin-bottom: 1rem;
  text-align: center;
  letter-spacing: 0.025em;
}

.mockup-preview-wrap {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mockup-preview {
  background-color: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  width: 100%;
  height: 100%;
  max-height: 44dvh;
  aspect-ratio: 3/4;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mockup-preview:hover {
  border-color: rgba(59, 130, 246, 0.3);
}
.mockup-overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(2, 6, 23, 0.8), transparent, transparent);
  z-index: 1;
}
.mockup-preview-content {
  text-align: center;
  color: var(--slate-500);
  z-index: 2;
  transition: color 0.3s;
}
.mockup-preview:hover .mockup-preview-content {
  color: var(--blue-400);
}
.mockup-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.5rem;
  opacity: 0.6;
  transition: transform 0.3s;
}
.mockup-preview:hover .mockup-icon {
  transform: scale(1.1);
}
.mockup-title {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}
.mockup-subtext {
  font-size: 0.5625rem;
  color: var(--slate-600);
  margin-top: 0.125rem;
}

.form-group {
  margin-bottom: 1rem;
  width: 100%;
}
.form-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--slate-400);
  margin-bottom: 0.375rem;
}
.error-msg {
  color: var(--red-400);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
.gender-btn-group {
  display: flex;
  gap: 0.75rem;
}
.action-buttons {
  display: flex;
  gap: 0.75rem;
}
.share-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.action-icon {
  display: inline-block;
  width: 1.125rem;
  height: 1.125rem;
  margin-right: 0.375rem;
  vertical-align: middle;
}
.share-hint {
  font-size: 0.75rem;
  color: var(--slate-400);
  margin-top: 0.5rem;
  text-align: center;
}

.final-result-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  margin: 0 auto;
}

.share-wrap {
  max-height: none !important;
}

.developing-text {
  font-size: 0.75rem;
  color: var(--slate-300);
  margin-top: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.loading-percentage-text {
  font-size: 0.625rem;
  color: var(--slate-400);
  margin-top: 0.375rem;
  font-family: monospace;
}

.error-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 auto 0.5rem;
  color: rgba(239, 68, 68, 0.8);
}
.error-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--slate-100);
  margin-bottom: 0.25rem;
}
.error-body {
  font-size: 0.625rem;
  color: var(--slate-400);
  padding: 0 1rem;
}
.capture-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: var(--indigo-950);
}
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

with open("css/style.css", "r", encoding="utf-8") as f:
    old_css = f.read()

# Remove the old specific body/html block that we are replacing with our new reset
old_css = re.sub(r'html,\s*body\s*\{.*?\n\}\n*', '', old_css, flags=re.DOTALL)
old_css = re.sub(r'body\s*\{.*?\n\}\n*', '', old_css, count=1, flags=re.DOTALL)
old_css = re.sub(r'#app\s*\{.*?\n\}\n*', '', old_css, flags=re.DOTALL)
old_css = re.sub(r'\.step-section\s*\{.*?\n\}\n*', '', old_css, count=1, flags=re.DOTALL)
old_css = re.sub(r'\.step-section\.active\s*\{.*?\n\}\n*', '', old_css, count=1, flags=re.DOTALL)
old_css = re.sub(r'\.step-section\s*>\s*div:first-child\s*\{.*?\n\}\n*', '', old_css, flags=re.DOTALL)
old_css = re.sub(r'\.step-section\s*>\s*div:last-child\s*\{.*?\n\}\n*', '', old_css, flags=re.DOTALL)

# Insert the new variables and utilities at the top
new_css = css_insert + "\n" + old_css

with open("css/style.css", "w", encoding="utf-8") as f:
    f.write(new_css)

print("Migration completed.")
