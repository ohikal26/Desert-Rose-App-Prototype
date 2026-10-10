import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
import { StartChecklist } from './screens/StartChecklist'
import { OpenChecklist } from './screens/OpenChecklist'
import { ChecklistRun } from './screens/ChecklistRun'
import { NoProblemSelected, ProblemsLayout } from './screens/Problems'
import { ProblemDetail } from './screens/ProblemDetail'
import { NewProblem } from './screens/NewProblem'
import { Summary } from './screens/Summary'
import { Leadership } from './screens/Leadership'
import { DepartmentPage } from './screens/DepartmentOverview'
import { QrSheet } from './screens/QrSheet'
import { StartInspection } from './screens/StartInspection'
import { InspectionRun } from './screens/InspectionRun'
import { InspectionSummary } from './screens/InspectionSummary'
import { useData } from './data/DataContext'
import { useAppState } from './state/AppState'
import { useI18n } from './i18n/I18n'
import { needsMe } from './lib/problems'

export function App() {
  return (
    <HashRouter>
      <Frame />
    </HashRouter>
  )
}

// Task screens hide the menu so the main action sits at the bottom, within thumb reach.
const TASK_SCREENS = /^\/(checklist|checklists|inspection|inspections)\/|^\/problems\/new|^\/qr-sheet/
// A single problem hides the menu on phones only; tablets show it beside the list.
const DETAIL_SCREENS = /^\/problems\/[^/]+$/

function Frame() {
  const { data, error, user } = useData()
  const { pathname } = useLocation()
  const { userId } = useAppState()
  const { t } = useI18n()
  const me = user(userId)
  // In-app badge instead of push notifications: problems waiting on me.
  const badge = data && me
    ? data.problems.filter((p) => needsMe(p, me, data.locations.find((l) => l.id === p.location))).length
    : 0
  const navClass = TASK_SCREENS.test(pathname) ? 'hidden' : DETAIL_SCREENS.test(pathname) ? 'hide-on-phone' : ''

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
              <Route path="/problems" element={<ProblemsLayout />}>
                <Route index element={<NoProblemSelected />} />
                <Route path=":id" element={<ProblemDetail />} />
              </Route>
              <Route path="/checklists/start" element={<StartChecklist />} />
              <Route path="/checklist/open/:locationId/:templateId" element={<OpenChecklist />} />
              <Route path="/checklist/:runId" element={<ChecklistRun />} />
              <Route path="/problems/new" element={<NewProblem />} />
              <Route path="/summary" element={<Summary />} />
              <Route path="/leadership" element={<Leadership />} />
              <Route path="/department/:dept" element={<DepartmentPage />} />
              <Route path="/qr-sheet" element={<QrSheet />} />
              <Route path="/inspections/start/:templateId" element={<StartInspection />} />
              <Route path="/inspection/:runId/summary" element={<InspectionSummary />} />
              <Route path="/inspection/:runId/:index?" element={<InspectionRun />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
        {navClass !== 'hidden' && <BottomNav problemBadge={badge} className={navClass} />}
      </div>
  )
}
