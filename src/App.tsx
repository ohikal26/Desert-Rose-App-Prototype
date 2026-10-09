import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
import { Soon } from './screens/Soon'
import { StartChecklist } from './screens/StartChecklist'
import { OpenChecklist } from './screens/OpenChecklist'
import { ChecklistRun } from './screens/ChecklistRun'
import { useData } from './data/DataContext'
import { useAppState } from './state/AppState'
import { useI18n } from './i18n/I18n'
import { isActive, shownStatus } from './lib/problems'

export function App() {
  return (
    <HashRouter>
      <Frame />
    </HashRouter>
  )
}

// Task screens (a checklist in progress) hide the menu so the main action sits within thumb reach.
const TASK_SCREENS = /^\/(checklist|checklists)\//

function Frame() {
  const { data, error, user } = useData()
  const { pathname } = useLocation()
  const { userId } = useAppState()
  const { t } = useI18n()
  const me = user(userId)
  // In-app badge instead of push notifications: my problems that need action.
  const badge = data && me
    ? data.problems.filter((p) => p.owner === me.id && isActive(p) && (shownStatus(p) === 'overdue' || p.safety)).length
    : 0

  return (
      <div className="app">
        <Header />
        <main className="main" id="main">
          {error ? (
            <p className="card state-box" role="alert">{t('state.error')}</p>
          ) : (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/problems" element={<Soon stageOverride="3" />} />
              <Route path="/soon/:stage" element={<Soon />} />
              <Route path="/checklists/start" element={<StartChecklist />} />
              <Route path="/checklist/open/:locationId/:templateId" element={<OpenChecklist />} />
              <Route path="/checklist/:runId" element={<ChecklistRun />} />
              <Route path="/problems/new" element={<Soon stageOverride="3" />} />
            </Routes>
          )}
        </main>
        {!TASK_SCREENS.test(pathname) && <BottomNav problemBadge={badge} />}
      </div>
  )
}
