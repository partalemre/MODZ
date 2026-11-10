"""A click tour of every MODZ panel on the desktop engine: a person wandering through the menus, opening and closing.

Every mod in this checkout loads in a throwaway config and a throwaway git repo, so no press can touch real work and
no other checkout's mod stands in. From the hub each row opens its pane; every button in it is pressed on the tree drawn
before a redraw (what a desktop click is), what it opens is walked in turn, and it is pressed again to close. Inputs get
a word typed. A pane is then closed by hand and the hub comes back. Fails on: a dropped press, a blank pane ("Nothing to
show yet" on the desktop), a panel holding two panes, a pane that opened by itself, a hook the engine skipped or that threw.
Usage: python3 -I tools/desk/tour.py [repo] [mod ...]   (exit 1 on any failure)
"""
import json
import os
import re
import stat
import subprocess
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desk import Desk, Engine, walk  # noqa: E402

HUB = 'modz'
OPEN_WAIT_S = 8
SETTLE_S = 0.35
DEPTH_MAX = 3
PRESSES_MAX = 40
# Same-shaped rows ("open-3", "file-src/a.ts"): pressing the first few says what pressing the rest would.
FAMILY_MAX = 3
# What leaves the panel, costs a model call or changes what the mod is meant to keep: named in the report, never pressed.
# Its own repo's mod, so this checkout does not hold it; the hub sees the real home's link and offers its row.
SKIP_ROWS = {'open-transceiver'}
SKIP_KEY = re.compile(r'modz-home|modz-toggle|estimate|judge|uninstall|disable|turn-off', re.I)
# "Close" shuts the pane the tour is walking, in either language (replay's rt-close): named once, not pressed.
SKIP_LABEL = re.compile(r'estimate|tahmin|commit|push|gönder|uninstall|kaldır|disable|kapat$|^close$', re.I)
# Programs a press could reach out of the throwaway world with: answered by a stub on PATH.
STUBS = ('open', 'xdg-open', 'osascript', 'afplay', 'say', 'gh', 'pbcopy')
FIXTURE = {
    'package.json': '{"name":"tour","scripts":{"test":"node -e \\"console.log(1)\\""}}\n',
    'README.md': '# tour\n',
    'src/a.ts': 'export const a = 1\n',
    'src/deep/b.ts': 'export const b = 2\n',
}
IS_BAD_LOG = re.compile(r'hook skipped|hook failed|hooks? threw|did not load|wrong shape|refuses', re.I)


def wait(pred, secs):
    end = time.time() + secs
    while time.time() < end:
        if pred():
            return True
        time.sleep(0.2)
    return False


def world(repo, root):
    """The throwaway home (every mod linked), project and stubbed programs. Returns (home, project)."""
    home, project, stubs = (os.path.join(root, name) for name in ('home', 'project', 'bin'))
    os.makedirs(os.path.join(home, 'skills'))
    os.makedirs(project)
    os.makedirs(stubs)
    mods = os.path.join(repo, 'mods')
    for name in sorted(os.listdir(mods)):
        if os.path.isfile(os.path.join(mods, name, '.claude-plugin', 'plugin.json')):
            os.symlink(os.path.join(mods, name), os.path.join(home, 'skills', name))
    for name in STUBS:
        path = os.path.join(stubs, name)
        with open(path, 'w') as stub:
            stub.write('#!/bin/sh\nexit 0\n')
        os.chmod(path, os.stat(path).st_mode | stat.S_IEXEC)
    os.environ['PATH'] = f"{stubs}{os.pathsep}{os.environ['PATH']}"
    for name, text in FIXTURE.items():
        path = os.path.join(project, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as out:
            out.write(text)
    for args in (['init', '-q'], ['add', '-A'], ['-c', 'user.name=tour', '-c', 'user.email=tour@example.invalid', 'commit', '-qm', 'start']):
        subprocess.run(['git', *args], cwd=project, check=True)
    return home, project


class Tour:
    def __init__(self, engine, desk, log_path):
        self.e, self.d, self.log_path = engine, desk, log_path
        self.problems, self.skipped, self.presses, self.logged = [], [], 0, 0

    def ids(self):
        return [p['id'] for p in self.e.panes()]

    def fail(self, where, what):
        print(f'    ✘ {what}')
        self.problems.append(f'{where}: {what}')

    def new_log_lines(self):
        """Hook failures the engine logged since the last look."""
        try:
            with open(self.log_path, errors='replace') as log:
                lines = log.readlines()
        except OSError:
            return []
        fresh = lines[self.logged:]
        self.logged = len(lines)
        return [line.strip()[:220] for line in fresh if IS_BAD_LOG.search(line)]

    def draw(self, pane, where):
        """The pane's tree; a tree that is the engine's own is the blank tab a person would see."""
        tree = self.d.render(pane)
        if not isinstance(tree, dict) or tree.get('type') == 'engine':
            self.fail(where, f'pane {pane} is blank')
            return None
        return tree

    def press(self, key, stale, pane, where):
        """One click on a tree drawn before a redraw; True while the pane still stands."""
        self.d.render(pane, props={'isFocused': False, 'bodyColumns': 40})
        self.presses += 1
        try:
            answer = self.d.press(key, tree=stale)
        except Exception as cause:  # A press that raised is itself the finding: the tour goes on to the next.
            self.fail(where, f'{key}: the press raised {cause}')
            return True
        if not (answer or {}).get('handled'):
            self.fail(where, f'{key}: the press was dropped')
        time.sleep(SETTLE_S)
        for line in self.new_log_lines():
            self.fail(where, f'{key}: {line}')
        shown = self.ids()
        if len(shown) > 1:
            self.fail(where, f'{key}: the panel holds {shown}')
        return pane in shown

    def pressable(self, tree, seen):
        families = {}
        for key, _ in walk(tree, 'Button'):
            family = re.split(r'[-:/]', str(key))[0]
            families[family] = families.get(family, 0) + 1
            if key in seen or key is None or SKIP_KEY.search(str(key)) or families[family] > FAMILY_MAX:
                continue
            yield key

    def label_of(self, tree, key):
        if not isinstance(tree, dict):
            return ''
        if tree.get('type') == 'Button' and tree.get('props', {}).get('key') == key:
            return str(tree['props'].get('label', ''))
        return next((label for child in tree.get('children') or [] for label in [self.label_of(child, key)] if label), '')

    def crawl(self, pane, where, seen, depth=0):
        """Each button: press, walk what it opened, press again to close. False once the pane has gone."""
        tree = self.draw(pane, where)
        if tree is None:
            return False
        for key in list(self.pressable(tree, seen)):
            if self.presses >= self.limit:
                return True
            # Walking the last button's contents may have taken this one away, or already pressed it (the list was
            # made before that walk): a button is visited once, so it is pressed, or named as unpressed, once.
            if key in seen or key not in dict(walk(tree, 'Button')):
                continue
            seen.add(key)
            if SKIP_LABEL.search(self.label_of(tree, key)):
                self.skipped.append(f'{where}:{key}')
                continue
            if not self.press(key, tree, pane, where):
                return False
            if depth < DEPTH_MAX and not self.crawl(pane, where, seen, depth + 1):
                return False
            tree = self.draw(pane, where)
            if tree is None:
                return False
            if key in dict(walk(tree, 'Button')):
                if not self.press(key, tree, pane, where):
                    return False
                tree = self.draw(pane, where)
                if tree is None:
                    return False
        return True

    def type_in(self, pane, where):
        tree = self.draw(pane, where)
        for key, _ in walk(tree, 'Input') if tree else []:
            self.d.tree = tree
            answer = self.d.type(key, 'a', pane)
            if not (answer or {}).get('handled', True):
                self.fail(where, f'typing in {key} was dropped')
            time.sleep(SETTLE_S)
            self.draw(pane, where)
            for line in self.new_log_lines():
                self.fail(where, f'{key}: {line}')

    def hub(self):
        if self.ids() == [HUB]:
            return True
        self.e.say('/modz')
        return wait(lambda: HUB in self.ids(), OPEN_WAIT_S * 2)

    def visit(self, row):
        where = row.removeprefix('open-')
        print(f'  {where}')
        if not self.hub():
            self.fail(where, 'the hub could not be brought back')
            return
        stale = self.d.render(HUB)
        if not self.d.press(row, tree=stale).get('handled'):
            self.fail(where, 'the hub row press was dropped')
            return
        if not wait(lambda: len(self.ids()) == 1 and self.ids() != [HUB], OPEN_WAIT_S):
            self.fail(where, f'the panel holds {self.ids()}, want the row\'s pane alone')
            return
        pane = self.ids()[0]
        time.sleep(SETTLE_S)
        self.limit = self.presses + PRESSES_MAX
        before = self.presses
        if self.crawl(pane, where, set()):
            self.type_in(pane, where)
        # A press may have swapped the pane for another of the mod's own: the way home is wherever the panel is now.
        pane = next(iter(self.ids()), pane)
        tree = self.d.render(pane) if self.ids() else None
        if tree and 'modz-home' in dict(walk(tree, 'Button')):
            self.d.press('modz-home', tree=tree)
            if not wait(lambda: self.ids() == [HUB], OPEN_WAIT_S):
                self.fail(where, f'← MODZ left {self.ids()}')
        print(f'    {self.presses - before} presses')

    def close_by_hand(self):
        """The person shuts the panel with its close mark, then opens the hub again."""
        self.hub()
        answer = self.e.req({'subtype': 'ui_close', 'id': HUB})
        print(f'  close by hand: {json.dumps(answer.get("response", answer))[:120]}')
        if not wait(lambda: HUB not in self.ids(), OPEN_WAIT_S):
            self.fail('close', f'closing the hub left {self.ids()}')
        if not self.hub():
            self.fail('close', 'the hub did not come back after closing it')
        elif self.draw(HUB, 'close') is None:
            self.fail('close', 'the hub came back blank')


def main(repo, only):
    # The engine may still be writing as it stops, so its folder is cleared last and leniently.
    with tempfile.TemporaryDirectory(prefix='modz-tour-', ignore_cleanup_errors=True) as root:
        home, project = world(repo, root)
        log = os.path.join(root, 'debug.log')
        engine = Engine(project, extra=['--debug-file', log], home=home)
        desk = Desk(engine)
        tour = Tour(engine, desk, log)
        if not wait(lambda: HUB in tour.ids(), OPEN_WAIT_S * 2):
            print('✘ the MODZ hub did not open at session start')
            return 1
        # A mod that writes its hub row from the first message's hook has written it once one has gone by.
        engine.say('/modz')
        time.sleep(OPEN_WAIT_S / 2)
        rows = [key for key, _ in walk(desk.render(HUB), 'Button') if key.startswith('open-') and key != 'open-focus' and key not in SKIP_ROWS]
        print('rows:', ', '.join(row.removeprefix('open-') for row in rows))
        for row in rows:
            if not only or row.removeprefix('open-') in only:
                tour.visit(row)
        tour.close_by_hand()
        for line in tour.new_log_lines():
            tour.problems.append(f'log: {line}')
        if 'blast-radius' in tour.ids():
            tour.problems.append('blast-radius opened a tab')
        engine.close()
    for problem in tour.problems:
        print('✘', problem)
    print(f'tour: {len(rows)} rows, {tour.presses} presses, {len(tour.skipped)} left unpressed, {len(tour.problems)} problems')
    print('unpressed:', ', '.join(tour.skipped))
    return 1 if tour.problems else 0


if __name__ == '__main__':
    args = sys.argv[1:]
    sys.exit(main(os.path.abspath(args[0] if args else os.getcwd()), set(args[1:])))
