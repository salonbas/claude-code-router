/**
 * Clewdr Transformer
 *
 * 將 CCR / llms 使用的 OpenAI-style 請求
 * 轉換為 Clewdr Server 期望的格式。
 *
 * 目前 Clewdr 的 /v1/chat/completions：
 * - 請求/回應本身與 OpenAI 格式高度相容
 * - 唯一已知差異：tools 結構需要在頂層包含 name
 *
 * llms 統一格式中的 tools（OpenAI 標準）：
 * {
 *   "tools": [
 *     {
 *       "type": "function",
 *       "function": {
 *         "name": "get_weather",
 *         "description": "...",
 *         "parameters": {...}
 *       }
 *     }
 *   ]
 * }
 *
 * Clewdr 期望的格式（根據錯誤信息推斷）：
 * {
 *   "tools": [
 *     {
 *       "type": "function",
 *       "name": "get_weather",
 *       "description": "...",
 *       "parameters": {...}
 *     }
 *   ]
 * }
 */

class ClewdrTransformer {
  name = "clewdr";

  /**
   * 發送到 Clewdr 前的請求轉換
   * @param {Object} request - llms 的統一請求（OpenAI-style）
   * @returns {Object} - Clewdr 期望的請求格式
   */
  transformRequestIn(request) {
    // 基本上直接透傳，只對 tools 做結構調整
    const newRequest = { ...request };

    if (Array.isArray(request.tools) && request.tools.length > 0) {
      newRequest.tools = request.tools.map((tool) => {
        // 只處理標準 OpenAI function tool 結構
        if (
          tool &&
          tool.type === "function" &&
          tool.function &&
          typeof tool.function === "object"
        ) {
          const { name, description, parameters, ...restFn } = tool.function;

          // 將 name / description / parameters 提升到頂層
          const { function: _fn, ...restTool } = tool;

          return {
            ...restTool,
            // Clewdr 期望的字段
            name,
            description,
            parameters,
            // 如果 function 裡還有其他字段，一併展開（保險起見）
            ...restFn,
          };
        }

        // 非標準格式直接原樣返回，避免破壞未知結構
        return tool;
      });
    }

    return newRequest;
  }

  /**
   * 從 Clewdr 收到響應後的轉換
   * @param {Response} response - Fetch Response 對象
   * @returns {Promise<Response>}
   */
  async transformResponseOut(response) {
    // Clewdr 的響應已經是 OpenAI chat completions 格式，
    // llms 也使用該格式作為統一格式，因此這裡可以直接透傳。
    //
    // 如有需要，可以在這裡補上 model 字段等：
    //
    // if (response.headers.get("Content-Type")?.includes("application/json")) {
    //   const json = await response.json();
    //   if (!json.model && json.usage && json.choices) {
    //     json.model = "clewdr"; // 或填入實際模型名
    //   }
    //   return new Response(JSON.stringify(json), {
    //     status: response.status,
    //     statusText: response.statusText,
    //     headers: response.headers,
    //   });
    // }

    return response;
  }

  /**
   * 如需自訂 Header，可實作此方法。
   * 目前 Clewdr 使用標準 Bearer Token，無需特別處理。
   *
   * @param {Object} headers - 原始 headers
   * @param {string} apiKey - Provider 配置中的 api_key
   * @returns {Object} - 處理後的 headers
   */
  transformHeaders(headers, apiKey) {
    // 預設：保持 llms 的行為（使用 Authorization: Bearer <api_key>）
    const newHeaders = { ...headers };

    if (apiKey && !newHeaders.Authorization && !newHeaders.authorization) {
      newHeaders.Authorization = `Bearer ${apiKey}`;
    }

    return newHeaders;
  }
}

module.exports = ClewdrTransformer;



