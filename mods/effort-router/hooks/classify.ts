// The one judge call a prompt may cost in `auto`: the kit's judge over the engine calls the register module
// injects. The text is masked and cut before it goes anywhere (the person's own model, or TypeSafe Jev when
// they opted in).
import type { RouteClass } from '../types'
import { judge } from './kit/judge'
import type { JudgeIo } from './kit/judge'
import { CLASSES, classOf, JUDGE_INSTRUCTIONS, JUDGE_TEXT_MAX } from './route'
import { redact } from './turns'

// null: no judgment (the call failed, timed out or named no class); the turn then keeps the person's effort.
export async function classify(io: JudgeIo, text: string): Promise<RouteClass | null> {
  const masked = redact([...text].slice(0, JUDGE_TEXT_MAX).join(''))
  const answer = await judge({ ...io, redact }, { text: masked, labels: CLASSES, instructions: JUDGE_INSTRUCTIONS })

  return classOf(answer?.label)
}
