import { compareDistance, ProgramRuntime } from '../../runtime/executionContext';
import { SimpleBlock, SimpleStack } from './types';

type ActiveCallback = (blockId: string | null) => void;

async function executeSequence(
  blocks: SimpleBlock[],
  runtime: ProgramRuntime,
  onActive: ActiveCallback
): Promise<void> {
  // Precompute matching endLoop indices for repeat/forever blocks
  const loopEnd = new Map<number, number>();
  const stack: number[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'repeat' || b.type === 'forever') {
      stack.push(i);
    } else if (b.type === 'endLoop' && stack.length > 0) {
      const startIdx = stack.pop()!;
      loopEnd.set(startIdx, i);
    }
  }

  const runRange = async (start: number, end: number): Promise<void> => {
    let i = start;
    while (i < end) {
      runtime.checkAlive();
      const block = blocks[i];
      onActive(block.id);

      switch (block.type) {
        case 'motor':
          await runtime.motor(block.power, block.port);
          break;
        case 'stopMotor':
          await runtime.stopMotor(block.brake, block.port);
          break;
        case 'led':
          await runtime.ledHex(block.hex);
          break;
        case 'tone':
          await runtime.tone(block.freq, block.durationMs, true);
          break;
        case 'melody':
          await runtime.melody(block.melody);
          break;
        case 'wait':
          await runtime.wait(block.seconds);
          break;
        case 'waitDistance':
          await runtime.waitDistance(block.op, block.valueA, block.valueB);
          break;
        case 'waitTilt':
          await runtime.waitTilt(block.direction);
          break;
        case 'waitButton':
          await runtime.waitButton();
          break;
        case 'repeat': {
          const matchingEnd = loopEnd.get(i) ?? end;
          const count = Math.max(1, Math.min(999, Math.round(block.times)));
          for (let r = 0; r < count; r++) {
            runtime.checkAlive();
            await runRange(i + 1, matchingEnd);
          }
          i = matchingEnd;
          break;
        }
        case 'forever': {
          const matchingEnd = loopEnd.get(i) ?? end;
          while (!runtime.isStopped) {
            await runRange(i + 1, matchingEnd);
            await runtime.wait(0.03);
          }
          i = matchingEnd;
          break;
        }
        case 'endLoop':
          break;
      }
      i++;
    }
  };

  await runRange(0, blocks.length);
  onActive(null);
}

export async function runSimpleStacks(
  stacks: SimpleStack[],
  runtime: ProgramRuntime,
  onActiveBlock: (stackId: string, blockId: string | null) => void
): Promise<void> {
  const hasWatchers = stacks.some((s) => s.trigger.type !== 'start');

  for (const stack of stacks) {
    const cb = (blockId: string | null) => onActiveBlock(stack.id, blockId);
    const trig = stack.trigger;

    if (trig.type === 'start') {
      runtime.spawnTask(() => executeSequence(stack.blocks, runtime, cb));
    } else if (trig.type === 'distance') {
      runtime.spawnWatcher(
        () => compareDistance(runtime.distance(), trig.op, trig.valueA, trig.valueB),
        () => executeSequence(stack.blocks, runtime, cb)
      );
    } else if (trig.type === 'tilt') {
      runtime.spawnWatcher(
        () => runtime.tiltDirection() === trig.direction,
        () => executeSequence(stack.blocks, runtime, cb)
      );
    } else if (trig.type === 'button') {
      runtime.spawnWatcher(
        () => runtime.buttonPressed(),
        () => executeSequence(stack.blocks, runtime, cb)
      );
    } else if (trig.type === 'crash') {
      let lastCrash = runtime.crashCount();
      runtime.spawnWatcher(
        () => {
          const cur = runtime.crashCount();
          if (cur > lastCrash) {
            lastCrash = cur;
            return true;
          }
          return false;
        },
        () => executeSequence(stack.blocks, runtime, cb)
      );
    }
  }

  if (hasWatchers) {
    // Keep watchers active until user hits Stop
    await runtime.waitForAllTasks();
  } else {
    await runtime.waitForAllTasks();
  }
}
