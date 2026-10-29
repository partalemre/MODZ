"""End-to-end check of the MODZ mods on the desktop engine, the way the Code tab drives them.

A session starts in the repo with every linked mod, a desktop attaches, and the MODZ hub opens by itself. Each hub
row is pressed on a tree drawn before a redraw (what a desktop click is) and must swap the one panel to that mod:
its pane open, the hub closed, nothing else left as a tab. That pane must draw a tree of its own, keep each button's
press handle across a focus flip, and offer "← MODZ", whose press swaps the panel back to the hub alone. Its Svgs
(save a pressed row's still image, kit/press.tsx) must be interactive frames that entered as it opened, say their colour scheme and keep their very sources on a
redraw (kit/moving.ts), else the desktop rebuilds each frame and its loops restart. The band must draw a tree of its
own too, and the prompt footer (SessionMode) the engine's labels plus a "MODZ" toggle: a press on the tree drawn before
a redraw takes the hub away, the next brings it back alone. In the band only this repo's mods are held to the
pinned-handle rule; another plugin's buttons there are named, not failed.
Usage: python3 -I tools/desk/check.py [repo]   (exit 1 on any failure)
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desk import Desk, Engine, walk, words  # noqa: E402

HUB = 'modz'
SETTLE_S = 1.5
OPEN_WAIT_S = 8


def handles(tree, owners=None):
    """Each pressable element's handle; with `owners`, only those plugins' elements."""
    return {f'{kind}:{key}': p['handle'] for kind in ('Button', 'Input', 'Select') for key, p in walk(tree, kind)
            if owners is None or p['plugin'] in owners}


def own_mods(repo):
    """The plugin names this repo ships: the band check holds only them to the pinned-handle rule."""
    mods = os.path.join(repo, 'mods')
    manifests = [os.path.join(mods, name, '.claude-plugin', 'plugin.json') for name in os.listdir(mods)]
    return {json.load(open(path))['name'] for path in manifests if os.path.isfile(path)}


def check_band(desk, owners):
    """The band draws a tree, and MODZ's own buttons keep their handles across a focus flip. Other
    plugins' buttons are theirs to pin: they are named, not failed."""
    first = desk.render('above-prompt', 'AbovePrompt')
    if not isinstance(first, dict) or first.get('type') == 'engine':
        return 'AbovePrompt above-prompt: drew no tree of its own', []
    desk.render('above-prompt', 'AbovePrompt', {'isFocused': False, 'bodyColumns': 80})
    again = desk.render('above-prompt', 'AbovePrompt')
    others = sorted({p['plugin'] for kind in ('Button', 'Input', 'Select') for _, p in walk(first, kind)} - owners)
    same = handles(first, owners) == handles(again, owners)
    return (None if same else 'AbovePrompt above-prompt: press handles changed on a redraw'), others


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


# A pressed row's buttons wear a blank Hangul-filler label (kit/press.tsx): the drawing beneath them is a plain image.
BLANK = '\u3164'


def is_press_row(tree):
    """A box holding a drawing and the blank buttons of kit/press.tsx over it."""
    return any(str(p.get('props', {}).get('label', '')).startswith(BLANK) for p in buttons(tree))


def buttons(tree):
    if not isinstance(tree, dict):
        return []
    own = [tree] if tree.get('type') == 'Button' else []
    return own + [b for child in tree.get('children') or [] for b in buttons(child)]


def svgs(tree, is_pressed=False):
    """(alt, props, is_pressed) for every Svg in a tree, in document order; `is_pressed`: under a press row."""
    if not isinstance(tree, dict):
        return []
    is_pressed = is_pressed or (tree.get('type') == 'Box' and is_press_row(tree) and any(c.get('type') == 'Svg' for c in tree.get('children') or [] if isinstance(c, dict)))
    own = [(tree['props'].get('alt'), tree['props'], is_pressed)] if tree.get('type') == 'Svg' else []
    return own + [svg for child in tree.get('children') or [] for svg in svgs(child, is_pressed)]


def check_motion(desk, inst):
    """The pane's drawings in motion: kept frames that entered, said their scheme and hold still on a redraw."""
    # A pressed row's drawing is a still image under its buttons (a frame would swallow the click): held to the
    # stable-source rule, not to the frame and entrance rules.
    first, again = svgs(desk.render(inst)), svgs(desk.render(inst))
    if not first:
        return None
    framed = [(alt, props) for alt, props, is_pressed in first if not is_pressed]
    plain = [alt for alt, props in framed if not props.get('isInteractive')]
    if plain:
        return f'Pane {inst}: {len(plain)} Svg not interactive, e.g. {plain[0]!r}'
    if framed and not any('m-in' in props['source'] for _, props in framed):
        return f'Pane {inst}: no drawing entered as the pane opened'
    if not all(':root{color-scheme:' in props['source'] for _, props in framed):
        return f'Pane {inst}: a drawing does not say its colour scheme'
    moved = [alt for (alt, a, _), (_, b, _) in zip(first, again) if a['source'] != b['source']]
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


FOOTER_PROPS = {'modes': ['focus']}


def check_footer(desk, engine):
    """The footer keeps the engine's labels and its "MODZ" toggle takes the hub away and brings it back."""
    if not bring_hub(desk, engine):
        return 'footer: the hub could not be brought back first'
    tree = desk.render('session-mode', 'SessionMode', FOOTER_PROPS)
    if not isinstance(tree, dict) or tree.get('type') == 'engine':
        return 'footer: drew no tree of its own'
    if 'focus' not in ' '.join(words(tree)):
        return 'footer: the engine\'s labels were dropped'
    if handles(tree) != handles(desk.render('session-mode', 'SessionMode', FOOTER_PROPS)):
        return 'footer: press handles changed on a redraw'
    for want, label in (([], 'away'), ([HUB], 'back')):
        stale = desk.tree
        desk.render('session-mode', 'SessionMode', FOOTER_PROPS)
        if not desk.press('modz-toggle', tree=stale).get('handled'):
            return f'footer: the toggle press ({label}) was dropped'
        if not wait(lambda: ids(engine) == want, OPEN_WAIT_S):
            return f'footer: the toggle ({label}) left {ids(engine)}, want {want}'
    return None


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
    problem, others = check_band(desk, own_mods(repo))
    note = f'  (not ours, not checked: {", ".join(others)})' if others else ''
    print(f'  band {"":<18} {"✘ " + problem if problem else "✔"}{note}')
    failures += [problem] if problem else []
    problem = check_footer(desk, engine)
    print(f'  footer {"":<16} {"✘ " + problem if problem else "✔"}')
    failures += [problem] if problem else []
    engine.close()
    for failure in failures:
        print('✘', failure)
    print(f'desk: {len(rows)} hub rows, {len(failures)} failures')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main(os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())))
