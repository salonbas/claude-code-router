# 自訂 Server 整合指南

## 📋 需要修改的檔案清單

### 方案 1: 僅配置 Provider（最簡單）

**需要修改的檔案：**
- ✅ `~/.claude-code-router/config.json` - 添加 Provider 配置

**不需要修改源碼！**

---

### 方案 2: 使用自訂 Transformer（推薦）

**需要修改/創建的檔案：**

1. ✅ **創建 Transformer 檔案**
   - 路徑：`~/.claude-code-router/plugins/my-custom-transformer.js`
   - 參考：`plugins/my-custom-transformer.example.js`

2. ✅ **修改配置文件**
   - 路徑：`~/.claude-code-router/config.json`
   - 參考：`config-custom-server.example.json`
   - 需要添加：
     ```json
     {
       "transformers": [
         {
           "path": "~/.claude-code-router/plugins/my-custom-transformer.js"
         }
       ],
       "Providers": [
         {
           "name": "my-custom-server",
           "api_base_url": "http://localhost:8080/api/custom/chat",
           "api_key": "your-api-key",
           "models": ["my-custom-model"],
           "transformer": {
             "use": ["my-custom-transformer"]
           }
         }
       ]
     }
     ```

**不需要修改源碼！**

---

### 方案 3: 使用自訂 Router

**需要修改/創建的檔案：**

1. ✅ **創建 Router 檔案**
   - 路徑：`~/.claude-code-router/custom-router.js`
   - 參考：`custom-router-server.example.js`

2. ✅ **修改配置文件**
   - 路徑：`~/.claude-code-router/config.json`
   - 添加：
     ```json
     {
       "CUSTOM_ROUTER_PATH": "~/.claude-code-router/custom-router.js"
     }
     ```

**不需要修改源碼！**

---

### 方案 4: 修改源碼（最複雜，不推薦）

**需要修改的檔案：**

1. ⚠️ **修改 `src/index.ts`**
   - 在 `preHandler` hook 中添加自訂處理邏輯
   - 或添加新的處理函數

2. ⚠️ **修改 `src/server.ts`**（可選）
   - 如果需要添加新的端點
   - 如果需要修改 Server 初始化邏輯

3. ✅ **重新編譯**
   ```bash
   npm run build
   ```

---

## 🚀 快速開始（推薦方案 2）

### 步驟 1: 創建 Transformer

```bash
# 複製範例檔案
cp plugins/my-custom-transformer.example.js ~/.claude-code-router/plugins/my-custom-transformer.js

# 編輯檔案，根據您的 server 格式修改
nano ~/.claude-code-router/plugins/my-custom-transformer.js
```

### 步驟 2: 修改 config.json

```bash
# 編輯配置文件
nano ~/.claude-code-router/config.json
```

添加以下內容：

```json
{
  "transformers": [
    {
      "path": "~/.claude-code-router/plugins/my-custom-transformer.js"
    }
  ],
  "Providers": [
    {
      "name": "my-custom-server",
      "api_base_url": "http://localhost:8080/api/custom/chat",
      "api_key": "your-api-key-here",
      "models": ["my-custom-model"],
      "transformer": {
        "use": ["my-custom-transformer"]
      }
    }
  ],
  "Router": {
    "default": "my-custom-server,my-custom-model"
  }
}
```

### 步驟 3: 重啟服務

```bash
ccr restart
# 或
ccr stop
ccr start
```

### 步驟 4: 測試

在 Claude Code 中發送請求，應該會路由到您的自訂 server。

---

## 📝 關鍵配置說明

### Transformer 路徑

- 可以使用絕對路徑：`/Users/username/.claude-code-router/plugins/my-transformer.js`
- 可以使用 `~` 縮寫：`~/.claude-code-router/plugins/my-transformer.js`
- 可以使用相對路徑（相對於 config.json）

### Provider 配置

```json
{
  "name": "provider-name",           // 必須唯一
  "api_base_url": "http://...",       // 完整的 API 端點 URL
  "api_key": "your-key",              // API 密鑰
  "models": ["model1", "model2"],    // 可用的模型列表
  "transformer": {
    "use": ["transformer-name"]       // 使用的 transformer 名稱
  }
}
```

### Router 配置

```json
{
  "Router": {
    "default": "provider-name,model-name",  // 格式：provider,model
    "background": "provider-name,model-name",
    "think": "provider-name,model-name"
  }
}
```

---

## 🔍 調試技巧

### 查看日誌

```bash
# 查看最新日誌
tail -f ~/.claude-code-router/logs/ccr-*.log

# 查看應用日誌
tail -f ~/.claude-code-router/claude-code-router.log
```

### 測試 Transformer

在 transformer 中添加 `console.log` 來調試：

```javascript
transformRequestIn(request) {
  console.log('[Transformer] 收到請求:', JSON.stringify(request, null, 2));
  // ... 轉換邏輯
  console.log('[Transformer] 轉換後:', JSON.stringify(customRequest, null, 2));
  return customRequest;
}
```

### 測試 Router

在 router 中添加日誌：

```javascript
module.exports = async function router(req, config) {
  console.log('[Router] 請求模型:', req.body.model);
  console.log('[Router] Token 數量:', req.tokenCount);
  // ... 路由邏輯
};
```

---

## ❓ 常見問題

### Q: Transformer 沒有被調用？

A: 檢查：
1. transformer 檔案路徑是否正確
2. transformer 名稱是否與 `use` 中的名稱一致
3. 檢查日誌是否有錯誤訊息

### Q: 請求格式轉換失敗？

A: 檢查：
1. `transformRequestIn` 函數是否正確實現
2. 返回的格式是否符合您的 server 要求
3. 查看日誌中的請求內容

### Q: 響應格式轉換失敗？

A: 檢查：
1. `transformResponseOut` 函數是否正確實現
2. 是否正確處理了流式響應（如果使用）
3. 查看日誌中的響應內容

---

## 📚 參考檔案

- `custom-server-example.md` - 完整範例說明
- `plugins/my-custom-transformer.example.js` - Transformer 範例
- `config-custom-server.example.json` - 配置範例
- `custom-router-server.example.js` - Router 範例


