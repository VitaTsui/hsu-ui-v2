import { readStorage, writeStorage, STORAGE_KEY } from "../_utils/storage";
import { makeAutoObservable } from "mobx";

export type Layout = "left" | "top" | "mixed";

export type Theme = "light" | "dark";

export type HeaderTheme = "light" | "dark" | "theme";

// Three appearance modes (light / dark / follow system)
export type Appearance = "light" | "dark" | "system";

class ThemeStore {
  // Appearance mode selected by the user
  get appearance() {
    return this._appearance;
  }
  private _appearance: Appearance = "system";

  // Whether the system is currently dark (takes effect when appearance=system)
  private _systemDark = false;

  // Resolved actual dark-mode state
  get isDark(): boolean {
    if (this._appearance === "system") return this._systemDark;
    return this._appearance === "dark";
  }

  // Fixed left layout; switching is no longer offered
  get layout(): Layout {
    return "left";
  }

  // Nav light/dark follows the appearance
  get headerTheme(): HeaderTheme {
    return this.isDark ? "dark" : "light";
  }

  // Content theme follows the appearance
  get theme(): Theme {
    return this.isDark ? "dark" : "light";
  }

  constructor() {
    makeAutoObservable(this);

    const cached = readStorage(STORAGE_KEY.APPEARANCE) as Appearance | undefined;
    if (cached === "light" || cached === "dark" || cached === "system") {
      this._appearance = cached;
    }

    // Listen for system color-scheme changes, following in real time when appearance=system
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      this._systemDark = mq.matches;
      mq.addEventListener("change", (e) => this._setSystemDark(e.matches));
    }
  }

  private _setSystemDark = (v: boolean) => {
    this._systemDark = v;
  };

  public setAppearance = (appearance: Appearance) => {
    this._appearance = appearance;
    writeStorage(STORAGE_KEY.APPEARANCE, appearance);
  };
}

export default new ThemeStore();
