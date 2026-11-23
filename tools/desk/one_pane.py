"""The one panel, measured on the desktop engine: a hub row of a mod that draws inside the hub's pane must leave
exactly one pane listed at every moment (no second tab, no stand-in), draw that mod's page, take its presses, and
"← modz" must bring the hub back in the same pane.
Usage: python3 -I tools/desk/one_pane.py [repo] [row ...]   (exit 1 on any failure)
"""
import os
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desk import Desk, Engine, walk  # noqa: E402
from tour import world  # noqa: E402

HUB = 'modz'
WAIT_S = 8


def wait(pred, secs=WAIT_S):
    end = time.time() + secs
    while time.time() < end:
        if pred():
            return True
        time.sleep(0.1)
    return pred()


def pane_lists(engine):
    return [[p['id'] for p in m['panes']] for m in engine.msgs if m.get('type') == 'system' and m.get('subtype') == 'ui_panes']


def keys(tree):
    return [key for key, _ in walk(tree, 'Button')]


def check_row(engine, desk, row):
    problems = []
    seen = len(pane_lists(engine))
    hub = desk.render(HUB)
    if row not in keys(hub):
        return [f'{row}: no such hub row ({[k for k in keys(hub) if k.startswith("open-")]})']
    if not desk.press(row, tree=hub).get('handled'):
        problems.append(f'{row}: the press was dropped')
    time.sleep(1.5)
    lists = pane_lists(engine)[seen:]
    if any(len(ids) > 1 for ids in lists):
        problems.append(f'{row}: more than one pane listed on the way: {lists}')
    if any(ids and ids != [HUB] for ids in lists):
        problems.append(f'{row}: a pane other than the hub opened: {lists}')
    page = desk.render(HUB)
    if row in keys(page):
        problems.append(f'{row}: the pane still draws the hub')
    if 'modz-home' not in keys(page):
        problems.append(f'{row}: the page has no ← modz ({keys(page)[:8]})')
        return problems
    if not desk.press('modz-home', tree=page).get('handled'):
        problems.append(f'{row}: ← modz was dropped')
    back = wait(lambda: row in keys(desk.render(HUB)))
    if not back:
        problems.append(f'{row}: ← modz did not bring the hub back')
    if [p['id'] for p in engine.panes()] != [HUB]:
        problems.append(f'{row}: after ← modz the panel holds {[p["id"] for p in engine.panes()]}')
    return problems


def main(repo, rows):
    with tempfile.TemporaryDirectory(prefix='modz-one-', ignore_cleanup_errors=True) as root:
        home, project = world(repo, root)
        engine = Engine(project, home=home)
        desk = Desk(engine)
        engine.say('/modz')
        if not wait(lambda: HUB in [p['id'] for p in engine.panes()], WAIT_S * 2):
            print('✘ /modz did not open the hub')
            return 1
        problems = []
        for row in rows:
            found = check_row(engine, desk, row)
            print(f'  {row:<18} {"✘ " + "; ".join(found) if found else "✔"}')
            problems += found
        engine.close()
        return 1 if problems else 0


if __name__ == '__main__':
    args = sys.argv[1:]
    repo = os.path.abspath(args[0]) if args and os.path.isdir(args[0]) else os.getcwd()
    rows = [a for a in args if not os.path.isdir(a)] or ['open-plan']
    sys.exit(main(repo, rows))
