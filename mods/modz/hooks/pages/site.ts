// What a page is drawn into, and how a press on it reaches the mod that owns the page (pages/index.tsx).

// The room the page has, below the hub's "← modz" row.
export type PageSite = { columns: number; rows: number; surface: string }

/**
 * A press on a page the hub draws: written as `{ plugin: 'modz', key: 'act' }` = `{ page, action, arg?, at }`.
 * The page's mod hooks that write and does what its own pane's button did (only the owner writes its state).
 */
export type PageAct = (action: string, arg?: string) => void
