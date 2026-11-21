import * as Blockly from 'blockly';
import { javascriptGenerator, Order as JsOrder } from 'blockly/javascript';
import { pythonGenerator, Order as PyOrder } from 'blockly/python';

let registered = false;

export function registerWeDoGenerators(): void {
  if (registered) return;
  registered = true;

  // =========================================================================
  // 1. INTERNAL ASYNC JS GENERATOR (for running Blockly directly in browser)
  // =========================================================================

  // Wrap standard Blockly loops with cooperative async yield so Stop always works!
  const origWhile = javascriptGenerator.forBlock['controls_whileUntil'];
  javascriptGenerator.forBlock['controls_whileUntil'] = function (block, generator) {
    const code = origWhile.call(this, block, generator);
    return typeof code === 'string' ? code.replace(/\{\n/, '{\n  await __rt.wait(0.02);\n') : '';
  };

  const origRepeatExt = javascriptGenerator.forBlock['controls_repeat_ext'];
  javascriptGenerator.forBlock['controls_repeat_ext'] = function (block, generator) {
    const code = origRepeatExt.call(this, block, generator);
    return typeof code === 'string' ? code.replace(/\{\n/, '{\n  await __rt.wait(0.02);\n') : '';
  };

  javascriptGenerator.forBlock['wedo_on_start'] = (block, generator) => {
    const body = generator.statementToCode(block, 'DO');
    return `__rt.spawnTask(async () => {\n${body}});\n`;
  };

  javascriptGenerator.forBlock['wedo_when_distance'] = (block, generator) => {
    const op = block.getFieldValue('OP');
    const val = Number(block.getFieldValue('VAL'));
    const body = generator.statementToCode(block, 'DO');
    return `__rt.spawnWatcher(() => __cmp(__rt.distance(), ${JSON.stringify(op)}, ${val}), async () => {\n${body}});\n`;
  };

  javascriptGenerator.forBlock['wedo_when_distance_between'] = (block, generator) => {
    const min = Number(block.getFieldValue('MIN'));
    const max = Number(block.getFieldValue('MAX'));
    const body = generator.statementToCode(block, 'DO');
    return `__rt.spawnWatcher(() => __cmp(__rt.distance(), "between", ${min}, ${max}), async () => {\n${body}});\n`;
  };

  javascriptGenerator.forBlock['wedo_when_tilt'] = (block, generator) => {
    const dir = block.getFieldValue('DIR');
    const body = generator.statementToCode(block, 'DO');
    return `__rt.spawnWatcher(() => __rt.tiltDirection() === ${JSON.stringify(dir)}, async () => {\n${body}});\n`;
  };

  javascriptGenerator.forBlock['wedo_when_button'] = (block, generator) => {
    const body = generator.statementToCode(block, 'DO');
    return `__rt.spawnWatcher(() => __rt.buttonPressed(), async () => {\n${body}});\n`;
  };

  javascriptGenerator.forBlock['wedo_motor_power'] = (block, generator) => {
    const power = generator.valueToCode(block, 'POWER', JsOrder.NONE) || '0';
    const port = block.getFieldValue('PORT');
    return `await __rt.motor(${power}, ${JSON.stringify(port)});\n`;
  };

  javascriptGenerator.forBlock['wedo_motor_for'] = (block, generator) => {
    const power = generator.valueToCode(block, 'POWER', JsOrder.NONE) || '70';
    const sec = generator.valueToCode(block, 'SECONDS', JsOrder.NONE) || '1';
    const brake = block.getFieldValue('BRAKE') === 'true';
    const port = block.getFieldValue('PORT');
    return `await __rt.motorFor(${power}, ${sec}, ${brake}, ${JSON.stringify(port)});\n`;
  };

  javascriptGenerator.forBlock['wedo_motor_ramp'] = (block, generator) => {
    const from = generator.valueToCode(block, 'FROM', JsOrder.NONE) || '0';
    const to = generator.valueToCode(block, 'TO', JsOrder.NONE) || '100';
    const sec = generator.valueToCode(block, 'SECONDS', JsOrder.NONE) || '2';
    const port = block.getFieldValue('PORT');
    return `await __rt.rampMotor(${from}, ${to}, ${sec}, ${JSON.stringify(port)});\n`;
  };

  javascriptGenerator.forBlock['wedo_motor_stop'] = (block) => {
    const brake = block.getFieldValue('BRAKE') === 'true';
    const port = block.getFieldValue('PORT');
    return `await __rt.stopMotor(${brake}, ${JSON.stringify(port)});\n`;
  };

  javascriptGenerator.forBlock['wedo_get_distance'] = () => ['__rt.distance()', JsOrder.FUNCTION_CALL];
  javascriptGenerator.forBlock['wedo_get_distance_cm'] = () => ['__rt.distanceCm()', JsOrder.FUNCTION_CALL];

  javascriptGenerator.forBlock['wedo_distance_between'] = (block, generator) => {
    const min = generator.valueToCode(block, 'MIN', JsOrder.NONE) || '0';
    const max = generator.valueToCode(block, 'MAX', JsOrder.NONE) || '10';
    return [`__cmp(__rt.distance(), "between", ${min}, ${max})`, JsOrder.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock['wedo_wait_distance'] = (block, generator) => {
    const op = block.getFieldValue('OP');
    const val = generator.valueToCode(block, 'VAL', JsOrder.NONE) || '3';
    return `await __rt.waitDistance(${JSON.stringify(op)}, ${val});\n`;
  };

  javascriptGenerator.forBlock['wedo_motion_mode'] = (block) => {
    const mode = block.getFieldValue('MODE');
    return `await __rt.setMotionMode(${JSON.stringify(mode)});\n`;
  };

  javascriptGenerator.forBlock['wedo_get_count'] = () => ['__rt.motionCount()', JsOrder.FUNCTION_CALL];
  javascriptGenerator.forBlock['wedo_reset_count'] = () => `await __rt.resetMotionCount();\n`;

  javascriptGenerator.forBlock['wedo_get_tilt_angle'] = (block) => {
    const axis = block.getFieldValue('AXIS');
    return [axis === 'x' ? '__rt.tiltX()' : '__rt.tiltY()', JsOrder.FUNCTION_CALL];
  };

  javascriptGenerator.forBlock['wedo_is_tilt_dir'] = (block) => {
    const dir = block.getFieldValue('DIR');
    return [`(__rt.tiltDirection() === ${JSON.stringify(dir)})`, JsOrder.EQUALITY];
  };

  javascriptGenerator.forBlock['wedo_get_crash_count'] = () => ['__rt.crashCount()', JsOrder.FUNCTION_CALL];

  javascriptGenerator.forBlock['wedo_tilt_mode'] = (block) => {
    const mode = block.getFieldValue('MODE');
    return `await __rt.setTiltMode(${JSON.stringify(mode)});\n`;
  };

  javascriptGenerator.forBlock['wedo_led_rgb'] = (block, generator) => {
    const r = generator.valueToCode(block, 'R', JsOrder.NONE) || '0';
    const g = generator.valueToCode(block, 'G', JsOrder.NONE) || '0';
    const b = generator.valueToCode(block, 'B', JsOrder.NONE) || '0';
    return `await __rt.ledRgb(${r}, ${g}, ${b});\n`;
  };

  javascriptGenerator.forBlock['wedo_led_preset'] = (block) => {
    const c = Number(block.getFieldValue('COLOR'));
    return `await __rt.ledIndex(${c});\n`;
  };

  javascriptGenerator.forBlock['wedo_play_tone'] = (block, generator) => {
    const freq = generator.valueToCode(block, 'FREQ', JsOrder.NONE) || '440';
    const ms = generator.valueToCode(block, 'MS', JsOrder.NONE) || '300';
    return `await __rt.tone(${freq}, ${ms}, true);\n`;
  };

  javascriptGenerator.forBlock['wedo_play_note'] = (block, generator) => {
    const note = block.getFieldValue('NOTE');
    const ms = generator.valueToCode(block, 'MS', JsOrder.NONE) || '300';
    return `await __rt.note(${JSON.stringify(note)}, ${ms}, true);\n`;
  };

  javascriptGenerator.forBlock['wedo_play_melody'] = (block) => {
    const melody = block.getFieldValue('MELODY');
    return `await __rt.melody(${JSON.stringify(melody)});\n`;
  };

  javascriptGenerator.forBlock['wedo_hub_button'] = () => ['__rt.buttonPressed()', JsOrder.FUNCTION_CALL];
  javascriptGenerator.forBlock['wedo_battery'] = () => ['__rt.battery()', JsOrder.FUNCTION_CALL];

  javascriptGenerator.forBlock['wedo_wait'] = (block, generator) => {
    const sec = generator.valueToCode(block, 'SEC', JsOrder.NONE) || '1';
    return `await __rt.wait(${sec});\n`;
  };

  javascriptGenerator.forBlock['wedo_wait_until'] = (block, generator) => {
    const cond = generator.valueToCode(block, 'COND', JsOrder.NONE) || 'true';
    return `await __rt.waitUntil(() => Boolean(${cond}));\n`;
  };

  javascriptGenerator.forBlock['wedo_forever'] = (block, generator) => {
    const body = generator.statementToCode(block, 'DO');
    return `while (!__rt.isStopped) {\n${body}  await __rt.wait(0.03);\n}\n`;
  };

  javascriptGenerator.forBlock['wedo_log'] = (block, generator) => {
    const msg = generator.valueToCode(block, 'MSG', JsOrder.NONE) || '""';
    return `__rt.log(${msg});\n`;
  };

  // =========================================================================
  // 2. PYTHON GENERATOR (exports clean runnable Python for Python 3 Mode!)
  // =========================================================================

  pythonGenerator.forBlock['wedo_on_start'] = (block, generator) => {
    const body = generator.statementToCode(block, 'DO') || '  pass\n';
    return `async def on_start():\n${body}\nawait on_start()\n`;
  };

  pythonGenerator.forBlock['wedo_when_distance'] = (block, generator) => {
    const op = block.getFieldValue('OP');
    const val = Number(block.getFieldValue('VAL'));
    const body = generator.statementToCode(block, 'DO') || '  pass\n';
    const fnName = `on_dist_${block.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    return `async def ${fnName}():\n${body}on_distance(${JSON.stringify(op)}, ${val}, ${fnName})\n`;
  };

  pythonGenerator.forBlock['wedo_when_distance_between'] = (block, generator) => {
    const min = Number(block.getFieldValue('MIN'));
    const max = Number(block.getFieldValue('MAX'));
    const body = generator.statementToCode(block, 'DO') || '  pass\n';
    const fnName = `on_band_${block.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    return `async def ${fnName}():\n${body}on_distance_between(${min}, ${max}, ${fnName})\n`;
  };

  pythonGenerator.forBlock['wedo_when_tilt'] = (block, generator) => {
    const dir = block.getFieldValue('DIR');
    const body = generator.statementToCode(block, 'DO') || '  pass\n';
    const fnName = `on_tilt_${block.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    return `async def ${fnName}():\n${body}on_tilt(${JSON.stringify(dir)}, ${fnName})\n`;
  };

  pythonGenerator.forBlock['wedo_when_button'] = (block, generator) => {
    const body = generator.statementToCode(block, 'DO') || '  pass\n';
    const fnName = `on_btn_${block.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    return `async def ${fnName}():\n${body}on_button(${fnName})\n`;
  };

  pythonGenerator.forBlock['wedo_motor_power'] = (block, generator) => {
    const power = generator.valueToCode(block, 'POWER', PyOrder.NONE) || '0';
    const port = block.getFieldValue('PORT');
    return port === 'auto' ? `await motor(${power})\n` : `await motor(${power}, port=${JSON.stringify(port)})\n`;
  };

  pythonGenerator.forBlock['wedo_motor_for'] = (block, generator) => {
    const power = generator.valueToCode(block, 'POWER', PyOrder.NONE) || '70';
    const sec = generator.valueToCode(block, 'SECONDS', PyOrder.NONE) || '1';
    const brake = block.getFieldValue('BRAKE') === 'true' ? 'True' : 'False';
    const port = block.getFieldValue('PORT');
    return `await motor_for(${power}, ${sec}, brake=${brake}, port=${JSON.stringify(port)})\n`;
  };

  pythonGenerator.forBlock['wedo_motor_ramp'] = (block, generator) => {
    const from = generator.valueToCode(block, 'FROM', PyOrder.NONE) || '0';
    const to = generator.valueToCode(block, 'TO', PyOrder.NONE) || '100';
    const sec = generator.valueToCode(block, 'SECONDS', PyOrder.NONE) || '2';
    const port = block.getFieldValue('PORT');
    return `await ramp_motor(${from}, ${to}, ${sec}, port=${JSON.stringify(port)})\n`;
  };

  pythonGenerator.forBlock['wedo_motor_stop'] = (block) => {
    const brake = block.getFieldValue('BRAKE') === 'true' ? 'True' : 'False';
    const port = block.getFieldValue('PORT');
    return `await stop_motor(brake=${brake}, port=${JSON.stringify(port)})\n`;
  };

  pythonGenerator.forBlock['wedo_get_distance'] = () => ['distance()', PyOrder.FUNCTION_CALL];
  pythonGenerator.forBlock['wedo_get_distance_cm'] = () => ['distance_cm()', PyOrder.FUNCTION_CALL];

  pythonGenerator.forBlock['wedo_distance_between'] = (block, generator) => {
    const min = generator.valueToCode(block, 'MIN', PyOrder.NONE) || '0';
    const max = generator.valueToCode(block, 'MAX', PyOrder.NONE) || '10';
    return [`(${min} <= distance() <= ${max})`, PyOrder.RELATIONAL];
  };

  pythonGenerator.forBlock['wedo_wait_distance'] = (block, generator) => {
    const op = block.getFieldValue('OP');
    const val = generator.valueToCode(block, 'VAL', PyOrder.NONE) || '3';
    return `await wait_distance(${JSON.stringify(op)}, ${val})\n`;
  };

  pythonGenerator.forBlock['wedo_motion_mode'] = (block) => {
    const mode = block.getFieldValue('MODE');
    return `await set_motion_mode(${JSON.stringify(mode)})\n`;
  };

  pythonGenerator.forBlock['wedo_get_count'] = () => ['motion_count()', PyOrder.FUNCTION_CALL];
  pythonGenerator.forBlock['wedo_reset_count'] = () => `await reset_motion_count()\n`;

  pythonGenerator.forBlock['wedo_get_tilt_angle'] = (block) => {
    const axis = block.getFieldValue('AXIS');
    return [axis === 'x' ? 'tilt_x()' : 'tilt_y()', PyOrder.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['wedo_is_tilt_dir'] = (block) => {
    const dir = block.getFieldValue('DIR');
    return [`(tilt_direction() == ${JSON.stringify(dir)})`, PyOrder.RELATIONAL];
  };

  pythonGenerator.forBlock['wedo_get_crash_count'] = () => ['crash_count()', PyOrder.FUNCTION_CALL];

  pythonGenerator.forBlock['wedo_tilt_mode'] = (block) => {
    const mode = block.getFieldValue('MODE');
    return `await set_tilt_mode(${JSON.stringify(mode)})\n`;
  };

  pythonGenerator.forBlock['wedo_led_rgb'] = (block, generator) => {
    const r = generator.valueToCode(block, 'R', PyOrder.NONE) || '0';
    const g = generator.valueToCode(block, 'G', PyOrder.NONE) || '0';
    const b = generator.valueToCode(block, 'B', PyOrder.NONE) || '0';
    return `await led_rgb(${r}, ${g}, ${b})\n`;
  };

  pythonGenerator.forBlock['wedo_led_preset'] = (block) => {
    const c = Number(block.getFieldValue('COLOR'));
    return `await led_color(${c})\n`;
  };

  pythonGenerator.forBlock['wedo_play_tone'] = (block, generator) => {
    const freq = generator.valueToCode(block, 'FREQ', PyOrder.NONE) || '440';
    const ms = generator.valueToCode(block, 'MS', PyOrder.NONE) || '300';
    return `await tone(${freq}, ${ms})\n`;
  };

  pythonGenerator.forBlock['wedo_play_note'] = (block, generator) => {
    const note = block.getFieldValue('NOTE');
    const ms = generator.valueToCode(block, 'MS', PyOrder.NONE) || '300';
    return `await note(${JSON.stringify(note)}, ${ms})\n`;
  };

  pythonGenerator.forBlock['wedo_play_melody'] = (block) => {
    const melody = block.getFieldValue('MELODY');
    return `await melody(${JSON.stringify(melody)})\n`;
  };

  pythonGenerator.forBlock['wedo_hub_button'] = () => ['button_pressed()', PyOrder.FUNCTION_CALL];
  pythonGenerator.forBlock['wedo_battery'] = () => ['battery()', PyOrder.FUNCTION_CALL];

  pythonGenerator.forBlock['wedo_wait'] = (block, generator) => {
    const sec = generator.valueToCode(block, 'SEC', PyOrder.NONE) || '1';
    return `await wait(${sec})\n`;
  };

  pythonGenerator.forBlock['wedo_wait_until'] = (block, generator) => {
    const cond = generator.valueToCode(block, 'COND', PyOrder.NONE) || 'True';
    return `while not (${cond}):\n  await wait(0.05)\n`;
  };

  pythonGenerator.forBlock['wedo_forever'] = (block, generator) => {
    const body = generator.statementToCode(block, 'DO') || '  pass\n';
    return `while True:\n${body}  await wait(0.03)\n`;
  };

  pythonGenerator.forBlock['wedo_log'] = (block, generator) => {
    const msg = generator.valueToCode(block, 'MSG', PyOrder.NONE) || '""';
    return `log(${msg})\n`;
  };
}

export function generateBlocklyExecutionJs(workspace: Blockly.Workspace): string {
  registerWeDoGenerators();
  return javascriptGenerator.workspaceToCode(workspace);
}

export function generateBlocklyPython(workspace: Blockly.Workspace): string {
  registerWeDoGenerators();
  const body = pythonGenerator.workspaceToCode(workspace).trim();
  const header = `# Wygenerowano z WeDo 2.0 Studio (Blockly)\nfrom wedo import *\n\n`;
  return header + (body || 'await wait(0.1)\n');
}
