import { createContext, useContext } from "react";

// 建立跨元件傳遞資料的管道；真正的狀態由 DemoProvider 管理及提供。
// Context 不是全域變數，只有 Provider 下方的元件能取得其 value。
export const DemoContext = createContext(null);

/**
 * 讓 Provider 下層元件取得最近 DemoProvider 提供的狀態與更新函式。
 * 資料流：
 * useState 管理資料 -> Provider 提供 value -> Context 傳遞 -> useContext 讀取
 */
export function useDemo() {
  const context = useContext(DemoContext);

  // 找不到 Provider 時會取得預設值 null，直接拋錯以提示使用方式不正確。
  if (!context) throw new Error("useDemo must be used inside DemoProvider");

  return context;
}
