const STATUS_LABELS = {
  idle: "尚未測試",
  loading: "處理中",
  success: "上次請求成功",
  error: "上次請求失敗",
  incomplete: "請求未完成",
};

// 依目前 loading 與 Context/sessionStorage 的最後一則紀錄，顯示跨 Route 一致的真實請求狀態。
export default function RequestStatus({ isLoading, lastRole }) {
  const status = isLoading
    ? "loading"
    : lastRole === "assistant"
      ? "success"
      : lastRole === "error"
        ? "error"
        : lastRole === "user"
          ? "incomplete"
          : "idle";

  return (
    <span className="request-status" role="status" aria-live="polite">
      <span
        className={`status-dot status-${status}`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
