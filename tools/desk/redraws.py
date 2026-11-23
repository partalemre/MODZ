"""How often the mods ask every site to redraw, on the desktop engine: a quiet session with a desktop attached,
the hub open, nothing typed. Counts ui_invalidate messages over a window.
Usage: python3 -I tools/desk/redraws.py [repo] [seconds]
"""
import collections
import os
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desk import Desk, Engine  # noqa: E402
from tour import world  # noqa: E402


def main(repo, secs):
    with tempfile.TemporaryDirectory(prefix='modz-redraws-', ignore_cleanup_errors=True) as root:
        home, project = world(repo, root)
        engine = Engine(project, home=home)
        desk = Desk(engine)
        engine.say('/modz')
        time.sleep(8)
        desk.render('modz')
        start = len(engine.msgs)
        time.sleep(secs)
        kinds = collections.Counter(f"{m.get('type')}/{m.get('subtype')}" for m in engine.msgs[start:])
        engine.close()
        window = [m for m in engine.msgs[start:] if m.get('subtype') == 'ui_invalidate']
    unscoped = sum(1 for m in window if not m.get('instances'))
    print(f'{unscoped} redraw-everything and {len(window) - unscoped} targeted redraws in {secs}s')
    print('  ' + ', '.join(f'{k} {n}' for k, n in kinds.most_common(8)))


if __name__ == '__main__':
    args = sys.argv[1:]
    repo = os.path.abspath(args[0]) if args and os.path.isdir(args[0]) else os.getcwd()
    secs = int(next((a for a in args if a.isdigit()), '90'))
    main(repo, secs)
