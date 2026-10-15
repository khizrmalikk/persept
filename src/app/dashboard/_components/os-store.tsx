"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AgentKey } from "./Persona";

// The OS navigation / UI state — the prototype store's `ui` slice only:
// { win, sub, drawer, thread, pal, notif, toast, theme }. Business data
// (approvals, deals, …) is fetched server-side and passed into windows; it does
// NOT live here. One window at a time; the drawer, palette and notifications
// are overlays on top.

export type WindowKey =
  | "command"
  | "approvals"
  | "warroom"
  | "frontdesk"
  | "marketing"
  | "dev"
  | "knowledge"
  | "agent";

// Deep-link payload: approval id, deal key, a tab, a project (p), an agent (k),
// or a goal (the war room preselects it).
export type OSSub = {
  id?: string;
  deal?: string;
  tab?: string;
  p?: string;
  k?: AgentKey;
  goal?: string;
};

type Theme = "dark" | "light";

// v3 §4 view menu: four toggles that the menu's checkmarks reflect. The visual
// EFFECTS (hiding widgets / heat map / data links / banners) are wired in a
// later phase; for now these only persist (localStorage, like theme).
export type ViewKey = "heatMap" | "dataLinks" | "widgets" | "banners";
export type ViewState = Record<ViewKey, boolean>;

type OSState = {
  win: WindowKey | null;
  sub: OSSub;
  drawer: boolean;
  thread: AgentKey;
  pal: boolean;
  notif: boolean;
  toast: string | null;
  theme: Theme;
  // v3 §6 window chrome: a window can be minimised (hidden toward the dock, but
  // win/sub kept) or zoomed (fills below the menu bar). Both are per-window UI
  // state; open()/close() clear them.
  minimized: boolean;
  zoomed: boolean;
  // v3 §4 menu bar: which title's dropdown is open (null = none). §5 system
  // monitor popover. §10 about sheet and §9 lock screen (built in Phase 4 — the
  // state lives here now so the menu items can set it). §4 view toggles.
  menu: string | null;
  monitorOpen: boolean;
  aboutOpen: boolean;
  locked: boolean;
  view: ViewState;
  // v3 §3 boot screen: true until the start-up sequence finishes (or is skipped
  // on a repeat visit / embed / reduced motion). §7 desktop context menu: the
  // cursor position of an open right-click menu, null when closed.
  booting: boolean;
  ctxMenu: { x: number; y: number } | null;
};

type OSApi = OSState & {
  open: (win: WindowKey, sub?: OSSub) => void;
  openAgent: (k: AgentKey, sub?: OSSub) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  toggleZoom: () => void;
  toggleDrawer: (thread?: AgentKey) => void;
  openDrawer: (thread?: AgentKey) => void;
  closeDrawer: () => void;
  setThread: (k: AgentKey) => void;
  openPal: () => void;
  closePal: () => void;
  toggleNotif: () => void;
  closeOverlays: () => void;
  showToast: (msg: string) => void;
  // soft-refresh the current window's server data (⌘R / header button) — re-runs
  // the loaders without a full browser reload.
  refresh: () => void;
  toggleTheme: () => void;
  // v3 §4 menu bar
  setMenu: (menu: string | null) => void;
  // v3 §5 system monitor
  openMonitor: () => void;
  closeMonitor: () => void;
  // v3 §10 about · §9 lock (effects are Phase 4; these just flip the state)
  openAbout: () => void;
  closeAbout: () => void;
  lock: () => void;
  unlock: () => void;
  // v3 §4 view toggles (persisted; effects are a later phase)
  toggleView: (key: ViewKey) => void;
  // v3 §3 boot: the boot screen flips this false when the sequence ends.
  endBoot: () => void;
  // v3 §7 desktop context menu: open at a cursor point / close it.
  openCtxMenu: (x: number, y: number) => void;
  closeCtxMenu: () => void;
};

const Ctx = createContext<OSApi | null>(null);

export function useOS(): OSApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOS must be used inside <OSProvider>");
  return v;
}

export function OSProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<OSState>({
    win: null,
    sub: {},
    drawer: false,
    thread: "chief",
    pal: false,
    notif: false,
    toast: null,
    theme: "dark",
    minimized: false,
    zoomed: false,
    menu: null,
    monitorOpen: false,
    aboutOpen: false,
    locked: false,
    view: { heatMap: true, dataLinks: true, widgets: true, banners: true },
    booting: true,
    ctxMenu: null,
  });
  const patch = useCallback((p: Partial<OSState>) => {
    setS((prev) => ({ ...prev, ...p }));
  }, []);

  // theme: load the saved preference once, persist on change
  useEffect(() => {
    const saved = window.localStorage.getItem("os-theme");
    if (saved === "light" || saved === "dark") patch({ theme: saved });
  }, [patch]);

  // v3 §4 view toggles: load the saved map once (missing keys default to true)
  useEffect(() => {
    const raw = window.localStorage.getItem("os-view");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<ViewState>;
      patch({
        view: {
          heatMap: saved.heatMap ?? true,
          dataLinks: saved.dataLinks ?? true,
          widgets: saved.widgets ?? true,
          banners: saved.banners ?? true,
        },
      });
    } catch {
      // ignore malformed value
    }
  }, [patch]);

  // deep links: open a window from ?win=…&id=…&deal=…&tab=…&p=…&k=… on load.
  // Telegram/bridge links like /dashboard/approvals/<id> redirect to these params,
  // so a tapped notification opens the right window with the item selected.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const win = p.get("win");
    const WINS = [
      "command",
      "approvals",
      "warroom",
      "frontdesk",
      "marketing",
      "dev",
      "knowledge",
      "agent",
    ];
    if (win && WINS.includes(win)) {
      const sub: OSSub = {};
      const id = p.get("id");
      if (id) sub.id = id;
      const deal = p.get("deal");
      if (deal) sub.deal = deal;
      const tab = p.get("tab");
      if (tab) sub.tab = tab;
      const proj = p.get("p");
      if (proj) sub.p = proj;
      const k = p.get("k");
      if (k) sub.k = k as AgentKey;
      const goal = p.get("goal");
      if (goal) sub.goal = goal;
      patch({ win: win as WindowKey, sub });
    }
  }, [patch]);

  const toastTimer = useRef<number | undefined>(undefined);
  const toast = useCallback(
    (msg: string) => {
      window.clearTimeout(toastTimer.current);
      patch({ toast: msg });
      toastTimer.current = window.setTimeout(
        () => patch({ toast: null }),
        2400,
      );
    },
    [patch],
  );

  // router.refresh() re-runs the server loaders in place (the dashboard is
  // force-dynamic + no-store) so the open window repaints with fresh data without
  // a full browser reload. A ref keeps the empty-dep ⌘R handler calling the latest.
  const router = useRouter();
  const refreshRef = useRef<() => void>(() => {});
  refreshRef.current = () => {
    router.refresh();
    toast("refreshing…");
  };

  const api = useMemo<OSApi>(
    () => ({
      ...s,
      open: (win, sub) =>
        patch({
          win,
          sub: sub ?? {},
          pal: false,
          notif: false,
          minimized: false,
          zoomed: false,
          menu: null,
          monitorOpen: false,
        }),
      openAgent: (k, sub) =>
        patch({
          win: "agent",
          sub: { ...(sub ?? {}), k },
          pal: false,
          notif: false,
          minimized: false,
          zoomed: false,
          menu: null,
          monitorOpen: false,
        }),
      close: () =>
        patch({
          win: null,
          sub: {},
          minimized: false,
          zoomed: false,
          menu: null,
          monitorOpen: false,
        }),
      minimize: () => patch({ minimized: true }),
      restore: () => patch({ minimized: false }),
      toggleZoom: () => patch({ zoomed: !s.zoomed }),
      toggleDrawer: (thread) =>
        patch({
          drawer: !s.drawer,
          thread: thread ?? s.thread,
          pal: false,
          notif: false,
        }),
      openDrawer: (thread) =>
        patch({
          drawer: true,
          thread: thread ?? s.thread,
          pal: false,
          notif: false,
        }),
      closeDrawer: () => patch({ drawer: false }),
      setThread: (k) => patch({ thread: k, drawer: true }),
      openPal: () => patch({ pal: true, notif: false }),
      closePal: () => patch({ pal: false }),
      toggleNotif: () => patch({ notif: !s.notif, pal: false }),
      closeOverlays: () => patch({ pal: false, notif: false }),
      showToast: toast,
      refresh: () => refreshRef.current(),
      toggleTheme: () => {
        const next: Theme = s.theme === "dark" ? "light" : "dark";
        window.localStorage.setItem("os-theme", next);
        patch({ theme: next });
      },
      // v3 §4: opening a menu closes the monitor; a menu and the monitor are
      // mutually exclusive top-level overlays.
      setMenu: (menu) =>
        patch({ menu, monitorOpen: menu ? false : s.monitorOpen }),
      openMonitor: () => patch({ monitorOpen: true, menu: null }),
      closeMonitor: () => patch({ monitorOpen: false }),
      openAbout: () => patch({ aboutOpen: true, menu: null }),
      closeAbout: () => patch({ aboutOpen: false }),
      lock: () => patch({ locked: true, menu: null, monitorOpen: false }),
      unlock: () => patch({ locked: false }),
      toggleView: (key) => {
        const next: ViewState = { ...s.view, [key]: !s.view[key] };
        window.localStorage.setItem("os-view", JSON.stringify(next));
        patch({ view: next });
      },
      endBoot: () => patch({ booting: false }),
      // the context menu is a top-level overlay; opening it closes any menu /
      // monitor (mutually exclusive), like the others.
      openCtxMenu: (x, y) =>
        patch({ ctxMenu: { x, y }, menu: null, monitorOpen: false }),
      closeCtxMenu: () => patch({ ctxMenu: null }),
    }),
    [s, patch, toast],
  );

  // keyboard: ⌘K palette, ⌘J Chief drawer, ⌥0–⌥7 windows + ⌥L lock (§11 — use
  // e.code because ⌥ rewrites e.key on macOS), Esc closes the top-most thing:
  // menu/monitor/about → palette/notifications → drawer → window.
  useEffect(() => {
    // ⌥n dock order (§4/§11): 0 desktop, then command, front desk, marketing,
    // dev, knowledge, war room, approvals.
    const ALT_WIN: Record<string, WindowKey | null> = {
      Digit0: null,
      Digit1: "command",
      Digit2: "frontdesk",
      Digit3: "marketing",
      Digit4: "dev",
      Digit5: "knowledge",
      Digit6: "warroom",
      Digit7: "approvals",
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setS((p) => ({ ...p, pal: !p.pal, notif: false, menu: null }));
      } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && k === "r") {
        // ⌘R soft-refreshes the current window instead of reloading the whole
        // page. ⌘⇧R still does a full browser reload (not intercepted).
        e.preventDefault();
        refreshRef.current();
      } else if ((e.metaKey || e.ctrlKey) && k === "j") {
        e.preventDefault();
        setS((p) => ({
          ...p,
          drawer: !p.drawer,
          thread: "chief",
          pal: false,
          notif: false,
          menu: null,
        }));
      } else if (e.altKey && e.code === "KeyL") {
        e.preventDefault();
        setS((p) => ({ ...p, locked: true, menu: null, monitorOpen: false }));
      } else if (e.altKey && e.code in ALT_WIN) {
        e.preventDefault();
        const win = ALT_WIN[e.code];
        setS((p) => ({
          ...p,
          win,
          sub: {},
          pal: false,
          notif: false,
          minimized: false,
          zoomed: false,
          menu: null,
          monitorOpen: false,
        }));
      } else if (e.key === "Escape") {
        setS((p) => {
          // v3 §11: the context menu closes first, then menu / monitor / about.
          if (p.ctxMenu) return { ...p, ctxMenu: null };
          if (p.menu) return { ...p, menu: null };
          if (p.monitorOpen) return { ...p, monitorOpen: false };
          if (p.aboutOpen) return { ...p, aboutOpen: false };
          if (p.pal || p.notif) return { ...p, pal: false, notif: false };
          if (p.drawer) return { ...p, drawer: false };
          // v3 §6/§11: a zoomed window restores to the inset frame first; a
          // normal window closes. Either way minimised/zoomed are cleared.
          if (p.win && p.zoomed) return { ...p, zoomed: false };
          return { ...p, win: null, sub: {}, minimized: false, zoomed: false };
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`os-root${s.theme === "light" ? " light" : ""}`}>
      <Ctx.Provider value={api}>{children}</Ctx.Provider>
      {/* v3 §Grain: fixed full-viewport fractal-noise overlay, non-interactive,
          overlay-blended above everything. Styling lives in os.css (.os-grain). */}
      <div className="os-grain" aria-hidden="true" />
    </div>
  );
}
