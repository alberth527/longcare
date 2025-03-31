# 長照機構查詢系統

這是一個基於 React + TypeScript + Vite 開發的長照機構查詢系統，提供直觀的介面讓使用者可以輕鬆查詢和瀏覽長照機構的詳細資訊。

## 功能特點

- 🗺️ 互動式地圖顯示：使用 Leaflet 實現機構位置的可視化
- 🔍 多條件搜尋：支援機構類型、地區、服務項目等多種搜尋條件
- 📱 響應式設計：完美適配桌面和移動設備
- 🎯 路線規劃：提供從使用者位置到機構的路線規劃功能
- 📊 詳細資訊展示：包含機構基本資訊、服務項目、設施設備等完整資料
- 🎨 現代化 UI：採用 Material Design 風格，提供優質的使用者體驗

## 技術棧

- React 18
- TypeScript
- Vite
- Leaflet (地圖功能)
- React Router (路由管理)
- CSS Modules (樣式管理)

## 開發環境設置

1. 克隆專案：
```bash
git clone [repository-url]
cd longcare
```

2. 安裝依賴：
```bash
npm install
```

3. 啟動開發服務器：
```bash
npm run dev
```

4. 構建生產版本：
```bash
npm run build
```

## 專案結構

```
longcare/
├── src/
│   ├── components/     # 可重用組件
│   ├── pages/         # 頁面組件
│   ├── utils/         # 工具函數
│   ├── types/         # TypeScript 類型定義
│   └── assets/        # 靜態資源
├── public/            # 公共資源
└── index.html         # HTML 模板
```

## 主要功能模塊

### 1. 首頁
- 搜尋功能
- 熱門機構推薦
- 最新公告

### 2. 搜尋頁面
- 多條件篩選
- 地圖視圖切換
- 搜尋結果列表

### 3. 機構詳情頁
- 基本資訊展示
- 互動式地圖
- 路線規劃
- 服務項目列表
- 設施設備展示

## 開發指南

### 代碼規範
- 使用 ESLint 進行代碼檢查
- 遵循 TypeScript 嚴格模式
- 使用 CSS Modules 避免樣式衝突

### 提交規範
- feat: 新功能
- fix: 修復問題
- docs: 文檔修改
- style: 代碼格式修改
- refactor: 代碼重構
- test: 測試相關
- chore: 其他修改

## 部署

1. 構建專案：
```bash
npm run build
```

2. 部署 `dist` 目錄到您的 Web 服務器

## 貢獻指南

1. Fork 專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 聯絡方式

如有任何問題或建議，請通過以下方式聯繫：
- Email: [your-email@example.com]
- 專案 Issue: [repository-issues-url]
