"""Speak the desktop app's control protocol to a real Claude Code engine: attach, render, press, type.

The desktop draws mod trees it gets from `ui_render` and sends clicks back as `ui_press`; this does the same over
stream-json, so a test sees exactly what a desktop click would. Used by check.py and the transceiver e2e.
"""
import json
import os
import queue
import subprocess
import threading
import time

REPLY_TIMEOUT_S = 30
DEFAULT_PROPS = {'isFocused': True, 'bodyColumns': 80}
# isFullscreen marks a surface that docks panes, as the Code tab's does; without it a pane waits unplaced.
VIEWPORT = {'columns': 90, 'rows': 50, 'isFullscreen': False}


def desktop_engine():
    """The newest engine the desktop app carries, else the `claude` on PATH."""
    base = os.path.expanduser('~/Library/Application Support/Claude/claude-code')
    versions = sorted(os.listdir(base), key=lambda v: [int(p) for p in v.split('.') if p.isdigit()]) if os.path.isdir(base) else []
    for version in reversed(versions):
        for build in os.listdir(os.path.join(base, version)):
            path = os.path.join(base, version, build, 'claude.app/Contents/MacOS/claude')
            if os.access(path, os.X_OK):
                return path
    return 'claude'


def oauth_token():
    """The signed-in account's token, for a session with its own config dir (never printed)."""
    raw = subprocess.run(['security', 'find-generic-password', '-s', 'Claude Code-credentials', '-w'],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(raw)['claudeAiOauth']['accessToken']


class Engine:
    """One headless session. `home` gives it its own config dir (its own plugin store): a second person."""

    def __init__(self, cwd, extra=(), home=None, engine=None):
        env = {**os.environ, 'CLAUDE_CODE_ARTIFACT': '1'}
        if home:
            os.makedirs(home, exist_ok=True)
            env.update(CLAUDE_CONFIG_DIR=home, CLAUDE_CODE_OAUTH_TOKEN=oauth_token())
        args = [engine or desktop_engine(), '-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', *extra]
        self.p = subprocess.Popen(args, cwd=cwd, env=env, text=True, bufsize=1,
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        self.n, self.replies, self.msgs = 0, {}, []
        threading.Thread(target=self._read, daemon=True).start()
        self.req({'subtype': 'initialize'}, 60)

    def _read(self):
        for line in self.p.stdout:
            try:
                m = json.loads(line)
            except ValueError:
                continue
            if m.get('type') == 'control_response':
                r = m.get('response', {})
                self.replies[r.get('request_id')] = r
            else:
                self.msgs.append(m)

    def req(self, request, timeout=REPLY_TIMEOUT_S):
        self.n += 1
        rid = f'r{self.n}'
        self.p.stdin.write(json.dumps({'type': 'control_request', 'request_id': rid, 'request': request}) + '\n')
        self.p.stdin.flush()
        end = time.time() + timeout
        while time.time() < end:
            if rid in self.replies:
                return self.replies.pop(rid)
            time.sleep(0.02)
        raise TimeoutError(request['subtype'])

    def say(self, text):
        self.p.stdin.write(json.dumps({'type': 'user', 'message': {'role': 'user', 'content': text}}) + '\n')
        self.p.stdin.flush()

    def panes(self):
        shown = [m for m in self.msgs if m.get('type') == 'system' and m.get('subtype') == 'ui_panes']
        return shown[-1]['panes'] if shown else []

    def close(self):
        self.p.stdin.close()
        self.p.terminate()


def walk(tree, kind):
    """(key, press) for every element of `kind` in a tree, in document order."""
    out = []
    if isinstance(tree, dict):
        if tree.get('type') == kind and tree.get('press'):
            out.append((tree.get('props', {}).get('key'), tree['press']))
        for child in tree.get('children') or []:
            out += walk(child, kind)
    return out


def words(tree):
    if isinstance(tree, str):
        return [tree]
    if not isinstance(tree, dict):
        return []
    own = {'Button': lambda t: ['[' + str(t.get('props', {}).get('label')) + ']'],
           'Input': lambda t: ['<' + str(t.get('props', {}).get('key')) + '>']}.get(tree.get('type'), lambda t: [])(tree)
    return own + [w for child in tree.get('children') or [] for w in words(child)]


class Desk:
    """One desktop client on an engine."""

    def __init__(self, engine, client='desk-1'):
        self.e, self.c, self.tree = engine, client, None
        engine.req({'subtype': 'ui_attach', 'surface': 'desktop', 'client_id': client, 'viewport': VIEWPORT})

    def render(self, inst, comp='Pane', props=None):
        r = self.e.req({'subtype': 'ui_render', 'surface': 'desktop', 'client_id': self.c, 'component': comp,
                        'instance_id': inst, 'props': props or DEFAULT_PROPS, 'viewport': VIEWPORT})
        self.tree = r.get('response', {}).get('tree')
        return self.tree

    def press(self, key, tree=None):
        held = dict(walk(tree or self.tree, 'Button'))
        if key not in held:
            raise KeyError(f'no button {key}; have {list(held)}')
        p = held[key]
        return self.e.req({'subtype': 'ui_press', 'plugin': p['plugin'], 'handle': p['handle'], 'key': key, 'surface': 'desktop'}, 60).get('response')

    def type(self, key, text, inst):
        held = dict(walk(self.tree, 'Input'))
        p = held[key]
        return self.e.req({'subtype': 'ui_input', 'plugin': p['plugin'], 'handle': p['handle'], 'key': key, 'kind': 'submit', 'value': text,
                           'component': 'Pane', 'instance_id': inst, 'surface': 'desktop'}, 60).get('response')

    def text(self):
        return ' '.join(w for w in words(self.tree) if w.strip())
