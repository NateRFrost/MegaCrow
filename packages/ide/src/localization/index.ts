import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import rosetta from "rosetta";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

export type IdeLocale = "en" | "ja";

export const IDE_LOCALES: IdeLocale[] = ["en", "ja"];

type LocaleCatalog = typeof en;

const i18n = rosetta<LocaleCatalog>({ en, ja });
i18n.locale("en");

export type IdeMessageKey = keyof LocaleCatalog;

export const getIdeLocale = (): IdeLocale => i18n.locale() as IdeLocale;

export const setIdeLocale = (locale: IdeLocale): void => {
  i18n.locale(locale);
};

export const translate = (
  key: IdeMessageKey,
  params?: Record<string, string | number>
): string => i18n.t(key, params);

interface IdeLocaleContextValue {
  locale: IdeLocale;
  setLocale: (locale: IdeLocale) => void;
  t: typeof translate;
}

const IdeLocaleContext = createContext<IdeLocaleContextValue | null>(null);

export function IdeLocaleProvider({
  locale,
  children,
}: {
  locale: IdeLocale;
  children: ReactNode;
}) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setIdeLocale(locale);
    setRevision((n) => n + 1);
  }, [locale]);

  const setLocale = useCallback((next: IdeLocale) => {
    setIdeLocale(next);
    setRevision((n) => n + 1);
  }, []);

  const value = useMemo<IdeLocaleContextValue>(
    () => ({
      locale: getIdeLocale(),
      setLocale,
      t: translate,
    }),
    [locale, revision, setLocale]
  );

  return createElement(IdeLocaleContext.Provider, { value }, children);
}

export function useIdeLocale(): IdeLocaleContextValue {
  const ctx = useContext(IdeLocaleContext);
  if (!ctx) {
    return {
      locale: getIdeLocale(),
      setLocale: setIdeLocale,
      t: translate,
    };
  }
  return ctx;
}

/** Prefer this in React components so they re-render when locale changes. */
export function useT(): typeof translate {
  return useIdeLocale().t;
}
