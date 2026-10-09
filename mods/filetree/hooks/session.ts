import type { Timer } from 'claude-code'

import type { Change } from './gitstatus'
import type { Background } from './gitjobs'

// What the hooks share for the session beyond `$.state`: the person's options, the pane's last window and the
// work in flight. A hot reload starts it afresh, as it did the hooks module's own variables.
export const mem = {
  blink: null as Timer | null,
  themePoll: null as Timer | null,
  themeMtime: null as number | null,
  generation: 0,
  lastPress: { key: '', at: 0 },
  noNerd: false,
  glyphSetting: 'auto',
  follow: true,
  followClaude: true,
  queuedReads: [] as string[],
  showReads: true,
  showWrites: true,
  searchIndex: null as { root: string; paths: Promise<string[]> } | null,
  activityId: 0,
  pointer: true,
  view: { from: 0, max: 0 },
  lastSync: 0,
  noDock: false,
  home: '',
  dirty: { root: '', files: {} } as { root: string; files: Record<string, Change> },
  lastRoot: '',
  sizeDefault: false,
  sizeEpoch: 0,
  sizeQueue: [] as string[],
  background: new Map<string, Background>(),
}
