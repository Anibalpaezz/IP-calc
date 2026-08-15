import { useCallback, type ReactNode } from "react";
import { LangContext, messages, type Lang, type LangContextValue } from "../i18n";

export function LanguageProvider({
  lang,
  onLangChange,
  children,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  children: ReactNode;
}) {
  const t = useCallback((key: string) => messages[lang][key] ?? messages.es[key] ?? key, [lang]);
  const ti = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let s = String(t(key));
      if (params) {
        for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
      }
      return s;
    },
    [t],
  );
  const value: LangContextValue = { lang, setLang: onLangChange, t, ti };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}