import { useEffect, useMemo, useState } from "react";
import { DemoContext } from "./useDemo";

// 同一瀏覽器 Tab 的所有 API 路由共用這兩個 key；不同 Tab 各自獨立。
// myspringai:userName -> 'alice'
// myspringai:messages -> {
//   alice: { '/openai/chat-jdbc': [...] },
//   bob: { '/openai/chat-jdbc': [...] }
// }
const USER_NAME_KEY = "myspringai:userName";
const MESSAGES_KEY = "myspringai:messages";

// readMessages：一次恢復目前瀏覽器 Tab 中所有 user -> endpoint 的歷史訊息集合；
// 並非只讀取目前使用者或目前 API 頁面，無資料或格式錯誤時使用空物件。
function readMessages() {
  try {
    return JSON.parse(sessionStorage.getItem(MESSAGES_KEY)) || {};
  } catch {
    return {};
  }
}

// 管理 demo 狀態，並透過 Context 提供給 App 下層元件。
export function DemoProvider({ children }) {
  // 優先還原 userName，沒有時使用預設值。
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem(USER_NAME_KEY) || "demo-user",
  );

  // setter：由 ChatBox 呼叫以修改訊息 state，並建立 userName -> endpoint 分組。
  const [messagesByUserAndEndpoint, setMessagesByUserAndEndpoint] =
    useState(readMessages);

  // useEffect：state 改變後保存到 sessionStorage，不負責修改或建立 state 結構。
  useEffect(() => {
    sessionStorage.setItem(USER_NAME_KEY, userName);
  }, [userName]);

  useEffect(() => {
    sessionStorage.setItem(
      MESSAGES_KEY,
      JSON.stringify(messagesByUserAndEndpoint),
    );
  }, [messagesByUserAndEndpoint]);

  // 以狀態為依賴快取 Provider value，減少不必要的物件重建。
  const value = useMemo(
    () => ({
      userName,
      setUserName,
      messagesByUserAndEndpoint,
      setMessagesByUserAndEndpoint,
    }),
    [userName, messagesByUserAndEndpoint],
  );

  // 下層元件可透過 useDemo() 取得這些狀態與更新函式。
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
