export default function SubmitButton({ isLoading, disabled, label }) {
  return (
    <button
      className="submit-button"
      type="submit"
      disabled={disabled || isLoading}
      aria-label={isLoading ? "處理中" : label}
      title={isLoading ? "處理中" : label}
    >
      {isLoading ? (
        <span className="submit-spinner" aria-hidden="true" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
        >
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}
