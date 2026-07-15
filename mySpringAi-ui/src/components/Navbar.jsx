import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { apiGroups } from '../config/apiRoutes'
import { useDemo } from '../context/useDemo'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { userName, setUserName } = useDemo()

  return (
    <>
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

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>mySpringAi</strong>
            <small>API Playground</small>
          </div>
        </div>

        <label className="identity-field">
          <span>Demo userName</span>
          <input
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            placeholder="demo-user"
            spellCheck="false"
          />
        </label>

        <nav aria-label="API navigation">
          {apiGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.routes.map((route) => (
                <NavLink
                  key={route.path}
                  to={route.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  <span>{route.label}</span>
                  {!route.ready && <small>SOON</small>}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
      </aside>
      {isOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setIsOpen(false)} />}
    </>
  )
}

export default Navbar
