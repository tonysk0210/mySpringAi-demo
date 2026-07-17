import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import apiClient from "../api/client";
import { useDemo } from "../context/useDemo";
import { apiTestGuides } from "../config/apiTestGuides";

// 本頁對應的後端 endpoint；集中成常數避免多處硬編碼。
const ENDPOINT = "/email/emailResponse";
const TEST_GUIDE = apiTestGuides[ENDPOINT];

// 將 API 回應統一轉成可顯示文字：字串直接使用，物件或陣列則格式化為 JSON。
function responseToText(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

// 依 Axios 錯誤類型產生顯示文字。
function errorToText(error) {
  // 切換頁面造成的主動取消不是失敗，不顯示錯誤訊息。
  if (axios.isCancel(error)) return null;

  // 已收到後端的非 2xx HTTP response：顯示 status；若有 response body，再換行顯示內容。
  if (error.response) {
    const detail = responseToText(error.response.data);
    return `HTTP ${error.response.status}${detail ? `\n${detail}` : ""}`;
  }

  // Request 已送出但沒有收到 response，通常代表後端未啟動、網路或 timeout 問題。
  if (error.request)
    return "無法連線到後端服務，請確認 Spring Boot 是否已啟動。";

  // 其他 request 建立錯誤優先顯示原始 message，沒有時使用預設訊息。
  return error.message || "建立請求時發生錯誤。";
}

export default function EmailEmailResponsePage() {
  // Context：目前使用者、跨頁共用的訊息 state，以及更新它的 setter。
  // messagesByUserAndEndpoint 是 DemoProvider 用 useState 管的記憶體物件，
  // 由 DemoContext 內的 useEffect 自動鏡射到 sessionStorage（分頁級持久化）。
  const { userName, messagesByUserAndEndpoint, setMessagesByUserAndEndpoint } =
    useDemo();

  // userKey：整理 userName；空白名稱統一歸類為 anonymous。與 ChatBox 對齊，共用同一份 Context state。
  const userKey = userName.trim() || "anonymous";

  // slot：這頁「上次操作留下的紀錄」，存在 Context state 裡。
  // 內容是兩個物件：第一個是使用者上次填的 name/message，第二個是 AI 回信或錯誤訊息；
  // 從沒操作過就是 []。這份資料會自動同步到 sessionStorage，所以切到別頁再回來、
  // 或按 F5 都能看到上次的內容；每次生成會整組覆蓋（不累積歷史）。
  const slot = useMemo(
    () => messagesByUserAndEndpoint[userKey]?.[ENDPOINT] || [],
    [messagesByUserAndEndpoint, userKey],
  );

  // 從 slot 拿出兩塊資料，分別用在兩個地方：
  //   savedInput   → 用來把「上次填的 name / message」填回下方輸入框
  //   latestResult → 用來把「上次 AI 回信或錯誤訊息」顯示在畫面中間的結果卡片
  const savedInput = slot.find((m) => m.role === "user");
  const latestResult = slot.find(
    (m) => m.role === "assistant" || m.role === "error",
  );

  // 兩個輸入框綁定的 state。
  // 第一次打開頁面時，用 savedInput 把上次填的值填回來（沒填過就顯示空字串）；
  // 之後使用者打字就即時更新畫面，按送出時再把當下的值透過 writeSlot 寫回 slot。
  const [customerName, setCustomerName] = useState(
    savedInput?.customerName || "",
  );
  const [customerMessage, setCustomerMessage] = useState(
    savedInput?.customerMessage || "",
  );

  // isLoading：API request 是否進行中。
  const [isLoading, setIsLoading] = useState(false);
  // controllerRef：目前 request 的 AbortController，供離開頁面時取消請求。
  const controllerRef = useRef(null);
  // textareaRef：訊息輸入框 DOM，送出後自動聚焦以便連續操作。
  const textareaRef = useRef(null);

  // 掛載時註冊 cleanup；元件卸載時取消未完成的 request，避免處理過期回應。
  useEffect(() => () => controllerRef.current?.abort(), []);

  // 進入頁面或送出完成時將焦點放回 textarea，方便使用者連續輸入。
  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  // 覆寫（非累積）本 endpoint 在 Context state 中的 slot；層層 spread 以保留其他使用者與其他 endpoint 的資料。
  // 呼叫 setter 後 DemoContext 內的 useEffect 會把整個訊息集合寫回 sessionStorage。
  function writeSlot(next) {
    setMessagesByUserAndEndpoint((current) => ({
      ...current,
      [userKey]: {
        ...(current[userKey] || {}),
        [ENDPOINT]: next,
      },
    }));
  }

  async function handleSubmit(event) {
    // 阻止 form 預設重新整理頁面，改由 JavaScript 處理送出。
    event.preventDefault();

    // 整理輸入；request 進行中則忽略（按鈕 disabled 已擋掉空白欄位）。
    const name = customerName.trim();
    const message = customerMessage.trim();
    if (isLoading) return;

    setIsLoading(true);

    // 為本次 request 建立取消控制器，供卸載時中止請求。
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // 送出雙欄位 payload；此 endpoint 不需要 userName header。
      const response = await apiClient.post(
        ENDPOINT,
        { customerName: name, customerMessage: message },
        { signal: controller.signal },
      );
      // 成功：整組覆蓋 slot（不 append），只保留最新一次結果。
      writeSlot([
        { role: "user", customerName: name, customerMessage: message },
        { role: "assistant", content: responseToText(response.data) },
      ]);
    } catch (error) {
      // 將 Axios 錯誤轉成可顯示訊息；主動取消時不顯示錯誤。
      const errorMessage = errorToText(error);
      if (errorMessage) {
        // 失敗：同樣整組覆蓋 slot，assistant 位置換成 error 訊息。
        writeSlot([
          { role: "user", customerName: name, customerMessage: message },
          { role: "error", content: errorMessage },
        ]);
      }
    } finally {
      // 正常完成或失敗時結束 loading；卸載造成的取消不再更新 state。
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  // 清空表單與 slot。
  function clearAll() {
    setCustomerName("");
    setCustomerMessage("");
    writeSlot([]);
  }

  // 是否已有可顯示結果，決定訊息區是空狀態還是結果卡片。
  const hasResult = !!latestResult;

  return (
    <article className="api-page">
      {/* 頁面標頭：說明 endpoint、標題、簡短描述。 */}
      <header className="page-header">
        <div>
          <p className="eyebrow">POST ENDPOINT</p>
          <h1>Automatic Email Response</h1>
          <p>輸入客戶名稱與訊息，AI 會產生一封專業的繁體中文回信。</p>
        </div>
        <code>API 端口：{ENDPOINT}</code>
      </header>

      <section className="chat-panel">
        {/* 工具列：狀態指示與 Clear 按鈕；loading 中或無內容可清時按鈕 disable。 */}
        <div className="chat-toolbar">
          <div>
            <span className="status-dot" /> Ready
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={
              isLoading || (!hasResult && !customerName && !customerMessage)
            }
          >
            Clear email 清除郵件
          </button>
        </div>

        {/* 訊息區由三段互斥/併存邏輯組成：空狀態、結果卡片、loading 動畫。 */}
        <div className="messages" aria-live="polite">
          {/* ① 空狀態：從未生成過且非 loading 時顯示引導。 */}
          {!hasResult && !isLoading && (
            <div className="empty-chat">
              <span>✉</span>
              <h2>準備生成客戶回信</h2>
              <p>填寫右下方的客戶名稱與訊息，按下 Generate 送出。</p>
              {TEST_GUIDE && (
                <div
                  className="test-guide"
                  role="note"
                  aria-label="API 測試說明"
                >
                  <p className="test-guide-summary">{TEST_GUIDE.summary}</p>
                  {TEST_GUIDE.testPoints?.length > 0 && (
                    <>
                      <p className="test-guide-heading">🎯 測試重點</p>
                      <ul>
                        {TEST_GUIDE.testPoints.map((point, index) => (
                          <li key={`tp-${index}`}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {TEST_GUIDE.sampleQueries?.length > 0 && (
                    <>
                      <p className="test-guide-heading">💬 建議提問</p>
                      <ul>
                        {TEST_GUIDE.sampleQueries.map((query, index) => (
                          <li key={`sq-${index}`}>
                            <button
                              type="button"
                              className="sample-query"
                              onClick={() => {
                                setCustomerMessage(query);
                                textareaRef.current?.focus();
                              }}
                              title="點擊填入 Customer message"
                            >
                              {query}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {TEST_GUIDE.notes && (
                    <p className="test-guide-notes">⚠️ {TEST_GUIDE.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ② 結果卡片：依 role 顯示為 Assistant 或 Error；pre 保留換行。 */}
          {hasResult && (
            <div className={`message ${latestResult.role}`}>
              <strong>
                {latestResult.role === "error" ? "Error" : "Assistant"}
              </strong>
              <pre>{latestResult.content}</pre>
            </div>
          )}
          {/* ③ loading：等待後端回應時顯示三點動畫，可與已有結果卡片同時存在。 */}
          {isLoading && (
            <div className="message assistant typing">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {/* 主輸入區：composer-stack 讓 name/message 共用同一段可用寬度，
              與右側 42px 送出鈕在同一個 flex row，視覺對齊。 */}
          <div>
            <div className="composer-stack">
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer name…"
                disabled={isLoading}
              />
              <textarea
                ref={textareaRef}
                value={customerMessage}
                onChange={(event) => setCustomerMessage(event.target.value)}
                placeholder="Customer message…"
                rows="4"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={
                !customerName.trim() || !customerMessage.trim() || isLoading
              }
              aria-label="Generate email response"
            >
              {isLoading ? "…" : "↑"}
            </button>
          </div>
          <small>填完兩欄後按 ↑ 送出</small>
        </form>
      </section>
    </article>
  );
}
