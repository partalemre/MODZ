"""End-to-end check of mods/pr-card on the desktop engine: the real Bash tool runs `gh pr create` against a stub gh,
and the group that call folds into must draw the card over the Code tab's control protocol. A small driver plugin
makes the call through `$.tool.call`, so the check needs no sign-in and spends no model turn.

The card must sit beside what lies beneath it (a skin's row, the engine's fold), keep its Refresh handle across a
redraw, and that press, on a tree drawn before the redraw, must reach gh.
Usage: python3 -I tools/desk/check_pr_card.py [repo]   (exit 1 on any failure)
"""
import json
import os
import stat
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from desk import Desk, Engine, VIEWPORT, walk  # noqa: E402

URL = 'https://github.com/acme/shop/pull/7'
TURN_WAIT_S = 30
COMMAND = 'gh pr create --fill'
DRIVER = '''export const register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    $.command.register({ name: 'desk-open-pr', description: 'pr-card desk check' })
    return result
  })
  on('command.run', { command: 'desk-open-pr' }, async $ => {
    await $.tool.call({ tool: 'Bash', command: 'gh pr create --fill', description: 'pr-card desk check' })
    return { text: 'ran' }
  })
}
'''
PRESS_WAIT_S = 8
VIEW = {
    'title': 'Add the checkout page', 'state': 'OPEN', 'isDraft': False, 'additions': 120, 'deletions': 8, 'changedFiles': 1,
    'files': [{'path': 'src/checkout.tsx', 'additions': 120, 'deletions': 8}],
    'statusCheckRollup': [{'name': 'unit tests', 'status': 'COMPLETED', 'conclusion': 'FAILURE'}],
    'reviewDecision': 'APPROVED', 'mergeable': 'MERGEABLE', 'mergeStateStatus': 'CLEAN',
}


def stub_gh(folder):
    """A gh that answers create with the PR's link and view with VIEW, and logs each call."""
    log = os.path.join(folder, 'gh.log')
    path = os.path.join(folder, 'gh')
    with open(os.path.join(folder, 'view.json'), 'w') as out:
        json.dump(VIEW, out)
    with open(path, 'w') as script:
        script.write(f'#!/bin/sh\necho "$*" >> "{log}"\n[ "$2" = create ] && echo "{URL}" && exit 0\ncat "{folder}/view.json"\n')
    os.chmod(path, os.stat(path).st_mode | stat.S_IXUSR)
    return log


def views(log):
    with open(log) as lines:
        return sum(' view ' in line for line in lines)


def wait(pred, secs):
    end = time.time() + secs
    while time.time() < end:
        if pred():
            return True
        time.sleep(0.2)
    return False


def driver(folder):
    """The plugin whose one command makes the Bash call, as the model would."""
    root = os.path.join(folder, 'driver')
    os.makedirs(os.path.join(root, '.claude-plugin'))
    os.makedirs(os.path.join(root, 'hooks'))
    with open(os.path.join(root, '.claude-plugin', 'plugin.json'), 'w') as out:
        json.dump({'name': 'pr-card-desk-driver', 'description': 'Opens a PR for the pr-card desk check'}, out)
    with open(os.path.join(root, 'hooks', 'hooks.json'), 'w') as out:
        json.dump({'modules': ['./register.js']}, out)
    with open(os.path.join(root, 'hooks', 'register.js'), 'w') as out:
        out.write(DRIVER)
    return root


def svgs(tree):
    if not isinstance(tree, dict):
        return []
    own = [tree['props']] if tree.get('type') == 'Svg' else []
    return own + [svg for child in tree.get('children') or [] for svg in svgs(child)]


def render(engine):
    props = {'calls': [{'tool_use_id': 'desk', 'tool': 'Bash', 'input': {'command': COMMAND}, 'isRunning': False, 'isErrored': False,
                        'isInterrupted': False, 'output': f'{URL}\n'}], 'isActive': False, 'isExpanded': False}
    return engine.req({'subtype': 'ui_render', 'surface': 'desktop', 'client_id': 'desk-1', 'component': 'ToolGroup',
                       'instance_id': 'desk', 'props': props, 'viewport': VIEWPORT})['response']


def main(repo):
    folder = tempfile.mkdtemp(prefix='pr-card-desk-')
    log = stub_gh(folder)
    os.environ['PATH'] = f'{folder}:{os.environ["PATH"]}'
    pr_card = os.path.join(repo, 'mods', 'pr-card')
    engine = Engine(repo, extra=('--plugin-dir', pr_card, '--plugin-dir', driver(folder), '--permission-mode', 'bypassPermissions'))
    desk = Desk(engine)
    engine.say('/desk-open-pr')
    if not wait(lambda: os.path.exists(log), TURN_WAIT_S):
        print('✘ the driver did not run gh pr create')
        print(json.dumps([m for m in engine.msgs if m.get('type') in ('assistant', 'result')])[-800:])
        return 1
    failures = []
    if not wait(lambda: views(log) >= 1, PRESS_WAIT_S):
        failures.append('tool.call did not ask gh pr view')
    time.sleep(1)
    first = render(engine)
    tree = first['tree']
    print('  drawn by', first.get('drawn_by'))
    pics = svgs(tree)
    alt = next((pic.get('alt', '') for pic in pics if 'acme/shop #7' in pic.get('alt', '')), '')
    # The person's MODZ_LANG reaches this engine, so the card may read in either language.
    if not any(word in alt for word in ('1 failed', '1 başarısız')):
        failures.append(f'the card says {alt!r}; drawn by {first.get("drawn_by")}')
    if not any('unit tests' in pic.get('source', '') for pic in pics):
        failures.append('the failing check is not on the card')
    held = dict(walk(tree, 'Button'))
    key = f'r-{URL}'
    if key not in held:
        failures.append(f'no Refresh button; have {list(held)}')
    else:
        again = render(engine)['tree']
        if dict(walk(again, 'Button')).get(key) != held[key]:
            failures.append('the Refresh handle changed on a redraw')
        before = views(log)
        if not desk.press(key, tree=tree).get('handled'):
            failures.append('a Refresh press on the earlier tree was dropped')
        elif not wait(lambda: views(log) > before, PRESS_WAIT_S):
            failures.append('the Refresh press did not reach gh')
    engine.close()
    for failure in failures:
        print('✘', failure)
    print(f'pr-card desk: {len(failures)} failures')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main(os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())))
