import { useState } from "react";
import { NavLink } from "react-router-dom";
import { apiGroups } from "../config/apiRoutes";
import { useDemo } from "../context/useDemo";

function Navbar() {
  // 控制行動版側邊選單開關；初始值 false 代表關閉，桌面版則由 CSS 固定顯示。
  const [isOpen, setIsOpen] = useState(false);

  // 讀取 DemoProvider 的共用使用者，修改後 ChatBox 也會取得相同值。
  const { userName, setUserName } = useDemo();

  return (
    <>
      {/* 行動版漢堡按鈕：三個 span 顯示為三條線，點擊時切換側邊選單開關。 */}
      <button
        className="nav-toggle"
        type="button"
        aria-label="Toggle API navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>mySpringAi</strong>
            <small>API Playground</small>
          </div>
        </div>

        <label className="identity-field">
          <span>Demo 輸入使用者名稱 </span>
          {/* Controlled input：畫面值與 Context 中的 userName 保持同步。 */}
          <input
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            placeholder="demo-user"
            spellCheck="false"
          />
        </label>

        <nav aria-label="API navigation">
          {/* 依 apiRoutes.js 的分組設定產生 Navbar，不在此處寫死各 API。 */}
          {apiGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.routes.map((route) => (
                // NavLink 依目前 URL 設定 active；切換頁面後同時關閉行動版選單。
                <NavLink
                  key={route.path}
                  to={route.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    isActive ? "active" : undefined
                  }
                >
                  {/* 顯示 apiRoutes.js 中設定的 API 導覽名稱。 */}
                  <span>{route.label}</span>
                  {/* 尚未完成的 API 頁面仍可進入，但會顯示 SOON。 */}
                  {!route.ready && <small>SOON</small>}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
      </aside>
      {/* 行動版選單開啟時顯示背景遮罩，點擊即可關閉。 */}
      {isOpen && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default Navbar;
