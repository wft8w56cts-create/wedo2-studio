import { Language } from '../../types/wedo';

function numShadow(num: number) {
  return { shadow: { type: 'math_number', fields: { NUM: num } } };
}

export function createToolbox(lang: Language) {
  const pl = lang === 'pl';
  return {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: pl ? 'Zdarzenia' : 'Events',
        colour: '42',
        contents: [
          { kind: 'block', type: 'wedo_on_start' },
          { kind: 'block', type: 'wedo_when_distance' },
          { kind: 'block', type: 'wedo_when_distance_between' },
          { kind: 'block', type: 'wedo_when_tilt' },
          { kind: 'block', type: 'wedo_when_button' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Silnik' : 'Motor',
        colour: '150',
        contents: [
          { kind: 'block', type: 'wedo_motor_power', inputs: { POWER: numShadow(75) } },
          {
            kind: 'block',
            type: 'wedo_motor_for',
            inputs: { POWER: numShadow(75), SECONDS: numShadow(1.5) },
          },
          {
            kind: 'block',
            type: 'wedo_motor_ramp',
            inputs: { FROM: numShadow(20), TO: numShadow(100), SECONDS: numShadow(2) },
          },
          { kind: 'block', type: 'wedo_motor_stop' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Odległość' : 'Distance',
        colour: '200',
        contents: [
          { kind: 'block', type: 'wedo_get_distance' },
          { kind: 'block', type: 'wedo_get_distance_cm' },
          {
            kind: 'block',
            type: 'wedo_distance_between',
            inputs: { MIN: numShadow(2), MAX: numShadow(5) },
          },
          { kind: 'block', type: 'wedo_wait_distance', inputs: { VAL: numShadow(3.0) } },
          { kind: 'block', type: 'wedo_motion_mode' },
          { kind: 'block', type: 'wedo_get_count' },
          { kind: 'block', type: 'wedo_reset_count' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Przechył' : 'Tilt',
        colour: '185',
        contents: [
          { kind: 'block', type: 'wedo_get_tilt_angle' },
          { kind: 'block', type: 'wedo_is_tilt_dir' },
          { kind: 'block', type: 'wedo_get_crash_count' },
          { kind: 'block', type: 'wedo_tilt_mode' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Hub (LED i Dźwięk)' : 'Hub (LED & Sound)',
        colour: '290',
        contents: [
          {
            kind: 'block',
            type: 'wedo_led_rgb',
            inputs: { R: numShadow(0), G: numShadow(200), B: numShadow(255) },
          },
          { kind: 'block', type: 'wedo_led_preset' },
          {
            kind: 'block',
            type: 'wedo_play_tone',
            inputs: { FREQ: numShadow(523), MS: numShadow(300) },
          },
          { kind: 'block', type: 'wedo_play_note', inputs: { MS: numShadow(300) } },
          { kind: 'block', type: 'wedo_play_melody' },
          { kind: 'block', type: 'wedo_hub_button' },
          { kind: 'block', type: 'wedo_battery' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Sterowanie' : 'Control',
        colour: '35',
        contents: [
          { kind: 'block', type: 'wedo_wait', inputs: { SEC: numShadow(1) } },
          { kind: 'block', type: 'wedo_wait_until' },
          { kind: 'block', type: 'wedo_forever' },
          { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: numShadow(5) } },
          { kind: 'block', type: 'controls_whileUntil' },
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'wedo_log', inputs: { MSG: { shadow: { type: 'text', fields: { TEXT: 'WeDo OK!' } } } } },
        ],
      },
      { kind: 'sep' },
      {
        kind: 'category',
        name: pl ? 'Logika' : 'Logic',
        colour: '210',
        contents: [
          { kind: 'block', type: 'logic_compare' },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_negate' },
          { kind: 'block', type: 'logic_boolean' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Matematyka' : 'Math',
        colour: '230',
        contents: [
          { kind: 'block', type: 'math_number', fields: { NUM: 10 } },
          { kind: 'block', type: 'math_arithmetic' },
          { kind: 'block', type: 'math_single' },
          { kind: 'block', type: 'math_round' },
          {
            kind: 'block',
            type: 'math_constrain',
            inputs: { LOW: numShadow(-100), HIGH: numShadow(100) },
          },
          {
            kind: 'block',
            type: 'math_random_int',
            inputs: { FROM: numShadow(1), TO: numShadow(100) },
          },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Tekst' : 'Text',
        colour: '160',
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_join' },
        ],
      },
      {
        kind: 'category',
        name: pl ? 'Zmienne' : 'Variables',
        colour: '330',
        custom: 'VARIABLE',
      },
      {
        kind: 'category',
        name: pl ? 'Funkcje' : 'Functions',
        colour: '290',
        custom: 'PROCEDURE',
      },
    ],
  };
}
