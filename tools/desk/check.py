"""End-to-end check of the MODZ mods on the desktop engine, the way the Code tab drives them.

A session starts in the repo with every linked mod, a desktop attaches, and the MODZ hub opens by itself. Each hub
row is pressed on a tree drawn before a redraw (what a desktop click is) and must swap the one panel to that mod:
its pane open, the hub closed, nothing else left as a tab. That pane must draw a tree of its own, keep each button's
press handle across a focus flip, and offer "← MODZ", whose press swaps the panel back to the hub alone. Its Svgs
must be interactive frames that entered as it opened, say their colour scheme and keep their very sources on a
redraw (kit/moving.ts), else the desktop rebuilds each frame and its loops restart. The band must draw a tree of its
own too.
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


def svgs(tree):
    """(alt, props) for every Svg in a tree, in document order."""
    if not isinstance(tree, dict):
        return []
    own = [(tree['props'].get('alt'), tree['props'])] if tree.get('type') == 'Svg' else []
    return own + [svg for child in tree.get('children') or [] for svg in svgs(child)]


def check_motion(desk, inst):
    """The pane's drawings in motion: kept frames that entered, said their scheme and hold still on a redraw."""
    first, again = svgs(desk.render(inst)), svgs(desk.render(inst))
    if not first:
        return None
    plain = [alt for alt, props in first if not props.get('isInteractive')]
    if plain:
        return f'Pane {inst}: {len(plain)} Svg not interactive, e.g. {plain[0]!r}'
    if not any('m-in' in props['source'] for _, props in first):
        return f'Pane {inst}: no drawing entered as the pane opened'
    if not all(':root{color-scheme:' in props['source'] for _, props in first):
        return f'Pane {inst}: a drawing does not say its colour scheme'
    moved = [alt for (alt, a), (_, b) in zip(first, again) if a['source'] != b['source']]
    return f'Pane {inst}: {len(moved)} source(s) changed on a redraw, e.g. {moved[0]!r}' if moved else None


def ids(engine):
    return [p['id'] for p in engine.panes()]


def check_home(desk, engine, inst):
    """The panel's way back: a "← MODZ" press that leaves the hub alone in the panel."""
    tree = desk.render(inst)
    if 'modz-home' not in [key for key, _ in walk(tree, 'Button')]:
        return f'Pane {inst}: no ← MODZ button'
    if not desk.press('modz-home', tree=tree).get('handled'):
        return f'Pane {inst}: the ← MODZ press was dropped'
    return None if wait(lambda: ids(engine) == [HUB], OPEN_WAIT_S) else f'Pane {inst}: ← MODZ left {ids(engine)} (want the hub alone)'


def bring_hub(desk, engine):
    """The hub alone in the panel, by /modz when a check left something else there."""
    if ids(engine) == [HUB]:
        return True
    engine.say('/modz')
    return wait(lambda: HUB in ids(engine), OPEN_WAIT_S * 2)


def check_row(desk, engine, row):
    """A press on the stale hub tree swaps the panel to the row's pane; that pane then draws and goes home."""
    problems = []
    if not bring_hub(desk, engine):
        return [f'hub {row}: the hub could not be brought back']
    stale = desk.render(HUB)
    desk.render(HUB, props={'isFocused': False, 'bodyColumns': 80})
    if not desk.press(row, tree=stale).get('handled'):
        return [f'hub {row}: a press on the earlier tree was dropped']
    swapped = wait(lambda: len(ids(engine)) == 1 and ids(engine) != [HUB], OPEN_WAIT_S)
    shown = ids(engine)
    print(f'  {row:<20} pressed ✔  panel {"✔ " + shown[0] if swapped else "✘ " + str(shown)}')
    if not swapped:
        return [f'hub {row}: the panel holds {shown}, want only the row\'s pane']
    time.sleep(SETTLE_S)
    for problem in (check_motion(desk, shown[0]), check_site(desk, shown[0]), check_home(desk, engine, shown[0])):
        problems += [problem] if problem else []
    return problems


def main(repo):
    engine = Engine(repo)
    desk = Desk(engine)
    failures = []
    if not wait(lambda: HUB in ids(engine), OPEN_WAIT_S * 2):
        failures.append('the MODZ hub did not open at session start')
    rows = [key for key, _ in walk(desk.render(HUB), 'Button') if key.startswith('open-') and key != 'open-focus']
    failures += [problem for problem in (check_motion(desk, HUB), check_site(desk, HUB)) if problem]
    for row in rows:
        failures += check_row(desk, engine, row)
    problem = check_site(desk, 'above-prompt', 'AbovePrompt')
    print(f'  band {"":<18} {"✘ " + problem if problem else "✔"}')
    failures += [problem] if problem else []
    engine.close()
    for failure in failures:
        print('✘', failure)
    print(f'desk: {len(rows)} hub rows, {len(failures)} failures')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main(os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())))
