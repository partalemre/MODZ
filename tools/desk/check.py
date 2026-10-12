"""End-to-end check of the MODZ mods on the desktop engine, the way the Code tab drives them.

A session starts in the repo with every linked mod, a desktop attaches, and the MODZ hub opens by itself. Each hub
row is pressed on a tree drawn before a redraw (what a desktop click is), and must open its panel; every panel and
the band must draw a tree of their own and keep each button's press handle across a focus flip, and every panel
but the hub must offer "← MODZ" back to it.
Usage: python3 -I tools/desk/check.py [repo]   (exit 1 on any failure)
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desk import Desk, Engine, walk  # noqa: E402

HUB = 'modz'
SETTLE_S = 1.5
OPEN_WAIT_S = 8


def handles(tree):
    return {f'{kind}:{key}': p['handle'] for kind in ('Button', 'Input', 'Select') for key, p in walk(tree, kind)}


def wait(pred, secs):
    end = time.time() + secs
    while time.time() < end:
        if pred():
            return True
        time.sleep(0.2)
    return False


def check_site(desk, inst, comp='Pane'):
    """A tree of the mod's own (not the engine's fallback), whose handles survive a focus flip."""
    first = desk.render(inst, comp)
    if not isinstance(first, dict) or first.get('type') == 'engine':
        return f'{comp} {inst}: drew no tree of its own'
    desk.render(inst, comp, {'isFocused': False, 'bodyColumns': 80})
    again = desk.render(inst, comp)
    return None if handles(first) == handles(again) else f'{comp} {inst}: press handles changed on a redraw'


def check_home(desk, inst):
    """The panel's way back: a "← MODZ" button whose press the panel's mod handles."""
    tree = desk.render(inst)
    if 'modz-home' not in [key for key, _ in walk(tree, 'Button')]:
        return f'Pane {inst}: no ← MODZ button'
    return None if desk.press('modz-home', tree=tree).get('handled') else f'Pane {inst}: the ← MODZ press was dropped'


def main(repo):
    engine = Engine(repo)
    desk = Desk(engine)
    failures = []
    if not wait(lambda: any(p['id'] == HUB for p in engine.panes()), OPEN_WAIT_S * 2):
        failures.append('the MODZ hub did not open at session start')
    stale = desk.render(HUB)
    rows = [key for key, _ in walk(stale, 'Button') if key.startswith('open-') and key != 'open-focus']
    for row in rows:
        before = {p['id'] for p in engine.panes()}
        desk.render(HUB, props={'isFocused': False, 'bodyColumns': 80})
        landed = desk.press(row, tree=stale)
        if not landed.get('handled'):
            failures.append(f'hub {row}: a press on the earlier tree was dropped')
            continue
        opened = wait(lambda: {p['id'] for p in engine.panes()} - before or row[len('open-'):] in before, OPEN_WAIT_S)
        print(f'  {row:<20} pressed ✔  panel {"✔" if opened else "✘"}')
        if not opened:
            failures.append(f'hub {row}: no panel opened')
    time.sleep(SETTLE_S)
    for pane in engine.panes():
        problem = check_site(desk, pane['id'])
        print(f'  pane {pane["id"]:<18} {"✘ " + problem if problem else "✔"}')
        failures += [problem] if problem else []
    for pane in engine.panes():
        problem = None if pane['id'] == HUB else check_home(desk, pane['id'])
        if pane['id'] != HUB:
            print(f'  home {pane["id"]:<18} {"✘ " + problem if problem else "✔"}')
        failures += [problem] if problem else []
    problem = check_site(desk, 'above-prompt', 'AbovePrompt')
    print(f'  band {"":<18} {"✘ " + problem if problem else "✔"}')
    failures += [problem] if problem else []
    engine.close()
    for failure in failures:
        print('✘', failure)
    print(f'desk: {len(rows)} hub rows, {len(engine.panes())} panels, {len(failures)} failures')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main(os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())))
