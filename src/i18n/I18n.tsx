import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import en from './en.json'
import ar from './ar.json'
import type { Lang, Location, Problem, TemplateItem, User } from '../types'
import { readPref, writePref } from '../lib/storage'

type UiKey = keyof typeof en | (string & {})
type Vars = Record<string, string | number>

const arUi = ar.ui as Record<string, string>
const arContent = ar.content as Record<string, string>

function fill(s: string, vars?: Vars): string {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

// Western digits in both languages, as in the resort's reports (brief 9).
const LOCALE: Record<Lang, string> = { en: 'en-GB', ar: 'ar-EG-u-nu-latn' }

interface I18nCtx {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
  toggleLang: () => void
  t: (key: UiKey, vars?: Vars) => string
  /** Demo content: English comes from the seed, Arabic from ar.json by key. */
  c: (key: string, english: string, vars?: Vars) => string
  locName: (l: Location | undefined) => string
  userName: (u: User | undefined) => string
  jobName: (u: User | undefined) => string
  itemText: (i: TemplateItem) => string
  problemTitle: (p: Problem) => string
  formatTime: (iso: string) => string
  formatDate: (isoOrDay: string) => string
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (readPref('lang') === 'ar' ? 'ar' : 'en'))

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writePref('lang', l)
  }, [])

  const value = useMemo<I18nCtx>(() => {
    const enUi = en as Record<string, string>
    const t = (key: UiKey, vars?: Vars) => fill((lang === 'ar' ? arUi[key] : undefined) ?? enUi[key] ?? key, vars)
    const c = (key: string, english: string, vars?: Vars) =>
      fill(lang === 'ar' ? arContent[key] ?? english : english, vars)
    const locName = (l: Location | undefined) => {
      if (!l) return ''
      if (l.type === 'room') return c('loc.room', l.name, { n: l.room! })
      if (l.type === 'building') return c('loc.building', l.name, { n: l.building! })
      if (l.type === 'corridor') return c('loc.corridor', l.name, { n: l.building! })
      return c(`loc.${l.id}`, l.name)
    }
    const dateFmt = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'short' })
    const timeFmt = new Intl.DateTimeFormat(LOCALE[lang], { hour: '2-digit', minute: '2-digit', hour12: false })
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLang,
      toggleLang: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      t,
      c,
      locName,
      userName: (u) => (u ? c(`user.${u.id}`, u.name) : ''),
      jobName: (u) => (u ? c(`job.${u.id}`, u.job) : ''),
      itemText: (i) => c(`item.${i.id}`, i.text),
      problemTitle: (p) => (p.titleKey ? c(p.titleKey, p.title) : p.title),
      formatTime: (iso) => timeFmt.format(new Date(iso)),
      formatDate: (s) => dateFmt.format(s.length === 10 ? new Date(`${s}T12:00:00`) : new Date(s)),
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useI18n outside I18nProvider')
  return c
}
