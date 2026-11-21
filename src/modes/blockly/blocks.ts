import * as Blockly from 'blockly';
import { Language } from '../../types/wedo';
import { LEGO_COLORS, MELODIES, NOTE_FREQUENCIES } from '../../wedo/protocol';

export function registerWeDoBlocks(lang: Language): void {
  const pl = lang === 'pl';

  const portOptions: Blockly.MenuOption[] = [
    ['Auto', 'auto'],
    [pl ? 'Port A' : 'Port A', 'A'],
    [pl ? 'Port B' : 'Port B', 'B'],
  ];

  const compareOptions: Blockly.MenuOption[] = [
    ['<', '<'],
    ['<=', '<='],
    ['>', '>'],
    ['>=', '>='],
    ['≈', '=='],
  ];

  const tiltDirOptions: Blockly.MenuOption[] = [
    [pl ? 'płasko' : 'flat', 'flat'],
    [pl ? 'w górę' : 'up', 'up'],
    [pl ? 'w dół' : 'down', 'down'],
    [pl ? 'w lewo' : 'left', 'left'],
    [pl ? 'w prawo' : 'right', 'right'],
  ];

  const legoColorOptions: Blockly.MenuOption[] = LEGO_COLORS.map((c) => [
    pl ? c.namePl : c.nameEn,
    String(c.index),
  ]);

  const noteOptions: Blockly.MenuOption[] = Object.keys(NOTE_FREQUENCIES).map((n) => [n, n]);

  const melodyOptions: Blockly.MenuOption[] = Object.entries(MELODIES).map(([k, m]) => [
    pl ? m.namePl : m.nameEn,
    k,
  ]);

  // --- EVENTS (Hat blocks) ---
  Blockly.Blocks['wedo_on_start'] = {
    init() {
      this.appendDummyInput().appendField(pl ? '▶ Gdy program startuje' : '▶ When program starts');
      this.appendStatementInput('DO');
      this.setColour(42);
      this.setTooltip(pl ? 'Uruchamia się przy kliknięciu Start' : 'Runs when Run is clicked');
    },
  };

  Blockly.Blocks['wedo_when_distance'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? '⚡ Gdy odległość' : '⚡ When distance')
        .appendField(new Blockly.FieldDropdown(compareOptions), 'OP')
        .appendField(new Blockly.FieldNumber(3.0, 0, 10, 0.1), 'VAL');
      this.appendStatementInput('DO');
      this.setColour(42);
    },
  };

  Blockly.Blocks['wedo_when_distance_between'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? '⚡ Gdy odległość od' : '⚡ When distance between')
        .appendField(new Blockly.FieldNumber(2.0, 0, 10, 0.1), 'MIN')
        .appendField(pl ? 'do' : 'and')
        .appendField(new Blockly.FieldNumber(5.0, 0, 10, 0.1), 'MAX');
      this.appendStatementInput('DO');
      this.setColour(42);
    },
  };

  Blockly.Blocks['wedo_when_tilt'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? '⚡ Gdy przechył =' : '⚡ When tilt =')
        .appendField(new Blockly.FieldDropdown(tiltDirOptions), 'DIR');
      this.appendStatementInput('DO');
      this.setColour(42);
    },
  };

  Blockly.Blocks['wedo_when_button'] = {
    init() {
      this.appendDummyInput().appendField(
        pl ? '⚡ Gdy naciśnięto przycisk Hubu' : '⚡ When Hub button pressed'
      );
      this.appendStatementInput('DO');
      this.setColour(42);
    },
  };

  // --- MOTOR ---
  Blockly.Blocks['wedo_motor_power'] = {
    init() {
      this.appendValueInput('POWER')
        .setCheck('Number')
        .appendField(pl ? 'Silnik moc (-100..100)' : 'Motor power (-100..100)');
      this.appendDummyInput()
        .appendField(pl ? 'port' : 'port')
        .appendField(new Blockly.FieldDropdown(portOptions), 'PORT');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(150);
    },
  };

  Blockly.Blocks['wedo_motor_for'] = {
    init() {
      this.appendValueInput('POWER')
        .setCheck('Number')
        .appendField(pl ? 'Silnik moc' : 'Run motor power');
      this.appendValueInput('SECONDS')
        .setCheck('Number')
        .appendField(pl ? 'przez (s)' : 'for (s)');
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            [pl ? 'hamulec' : 'brake', 'true'],
            [pl ? 'luz' : 'drift', 'false'],
          ]),
          'BRAKE'
        )
        .appendField(new Blockly.FieldDropdown(portOptions), 'PORT');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(150);
    },
  };

  Blockly.Blocks['wedo_motor_ramp'] = {
    init() {
      this.appendValueInput('FROM')
        .setCheck('Number')
        .appendField(pl ? 'Płynnie zmień moc od' : 'Ramp motor from');
      this.appendValueInput('TO').setCheck('Number').appendField(pl ? 'do' : 'to');
      this.appendValueInput('SECONDS')
        .setCheck('Number')
        .appendField(pl ? 'w (s)' : 'over (s)');
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(portOptions), 'PORT');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(150);
    },
  };

  Blockly.Blocks['wedo_motor_stop'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Zatrzymaj silnik' : 'Stop motor')
        .appendField(
          new Blockly.FieldDropdown([
            [pl ? 'hamulec' : 'brake', 'true'],
            [pl ? 'luzem' : 'drift', 'false'],
          ]),
          'BRAKE'
        )
        .appendField(new Blockly.FieldDropdown(portOptions), 'PORT');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(150);
    },
  };

  // --- MOTION / DISTANCE SENSOR ---
  Blockly.Blocks['wedo_get_distance'] = {
    init() {
      this.appendDummyInput().appendField(
        pl ? 'odległość (0.0 – 10.0)' : 'distance (0.0 – 10.0)'
      );
      this.setOutput(true, 'Number');
      this.setColour(200);
    },
  };

  Blockly.Blocks['wedo_get_distance_cm'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'odległość (ok. cm)' : 'distance (approx. cm)');
      this.setOutput(true, 'Number');
      this.setColour(200);
    },
  };

  Blockly.Blocks['wedo_distance_between'] = {
    init() {
      this.appendValueInput('MIN')
        .setCheck('Number')
        .appendField(pl ? 'odległość między' : 'distance between');
      this.appendValueInput('MAX').setCheck('Number').appendField(pl ? 'a' : 'and');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(200);
    },
  };

  Blockly.Blocks['wedo_wait_distance'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Czekaj aż odległość' : 'Wait until distance')
        .appendField(new Blockly.FieldDropdown(compareOptions), 'OP');
      this.appendValueInput('VAL').setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
    },
  };

  Blockly.Blocks['wedo_motion_mode'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Tryb czujnika odległości:' : 'Motion sensor mode:')
        .appendField(
          new Blockly.FieldDropdown([
            [pl ? 'Odległość' : 'Distance', 'detect'],
            [pl ? 'Zliczanie obiektów' : 'Object Count', 'count'],
          ]),
          'MODE'
        );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
    },
  };

  Blockly.Blocks['wedo_get_count'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'licznik obiektów' : 'object count');
      this.setOutput(true, 'Number');
      this.setColour(200);
    },
  };

  Blockly.Blocks['wedo_reset_count'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'Zeruj licznik obiektów' : 'Reset object count');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(200);
    },
  };

  // --- TILT SENSOR ---
  Blockly.Blocks['wedo_get_tilt_angle'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'kąt przechyłu oś' : 'tilt angle axis')
        .appendField(
          new Blockly.FieldDropdown([
            ['X (°)', 'x'],
            ['Y (°)', 'y'],
          ]),
          'AXIS'
        );
      this.setOutput(true, 'Number');
      this.setColour(185);
    },
  };

  Blockly.Blocks['wedo_is_tilt_dir'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'przechył =' : 'tilt is')
        .appendField(new Blockly.FieldDropdown(tiltDirOptions), 'DIR');
      this.setOutput(true, 'Boolean');
      this.setColour(185);
    },
  };

  Blockly.Blocks['wedo_get_crash_count'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'liczba wstrząsów' : 'crash count');
      this.setOutput(true, 'Number');
      this.setColour(185);
    },
  };

  Blockly.Blocks['wedo_tilt_mode'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Tryb czujnika przechyłu:' : 'Tilt sensor mode:')
        .appendField(
          new Blockly.FieldDropdown([
            [pl ? 'Kąty X/Y' : 'Angles X/Y', 'angle'],
            [pl ? 'Kierunek' : 'Direction', 'tilt'],
            [pl ? 'Wstrząsy' : 'Crash', 'crash'],
          ]),
          'MODE'
        );
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(185);
    },
  };

  // --- HUB (LED, SOUND, BUTTON, BATTERY) ---
  Blockly.Blocks['wedo_led_rgb'] = {
    init() {
      this.appendValueInput('R').setCheck('Number').appendField(pl ? 'Dioda RGB: R' : 'LED RGB: R');
      this.appendValueInput('G').setCheck('Number').appendField('G');
      this.appendValueInput('B').setCheck('Number').appendField('B');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(290);
    },
  };

  Blockly.Blocks['wedo_led_preset'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Dioda kolor LEGO' : 'LED LEGO color')
        .appendField(new Blockly.FieldDropdown(legoColorOptions), 'COLOR');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(290);
    },
  };

  Blockly.Blocks['wedo_play_tone'] = {
    init() {
      this.appendValueInput('FREQ').setCheck('Number').appendField(pl ? 'Zagraj ton (Hz)' : 'Play tone (Hz)');
      this.appendValueInput('MS').setCheck('Number').appendField(pl ? 'czas (ms)' : 'for (ms)');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(265);
    },
  };

  Blockly.Blocks['wedo_play_note'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Zagraj nutę' : 'Play note')
        .appendField(new Blockly.FieldDropdown(noteOptions), 'NOTE');
      this.appendValueInput('MS').setCheck('Number').appendField(pl ? 'czas (ms)' : 'for (ms)');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(265);
    },
  };

  Blockly.Blocks['wedo_play_melody'] = {
    init() {
      this.appendDummyInput()
        .appendField(pl ? 'Zagraj melodię' : 'Play melody')
        .appendField(new Blockly.FieldDropdown(melodyOptions), 'MELODY');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(265);
    },
  };

  Blockly.Blocks['wedo_hub_button'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'przycisk Hubu wciśnięty' : 'Hub button pressed');
      this.setOutput(true, 'Boolean');
      this.setColour(290);
    },
  };

  Blockly.Blocks['wedo_battery'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'bateria (%)' : 'battery (%)');
      this.setOutput(true, 'Number');
      this.setColour(290);
    },
  };

  // --- CONTROL & LOG ---
  Blockly.Blocks['wedo_wait'] = {
    init() {
      this.appendValueInput('SEC').setCheck('Number').appendField(pl ? 'Czekaj (s)' : 'Wait (s)');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(35);
    },
  };

  Blockly.Blocks['wedo_wait_until'] = {
    init() {
      this.appendValueInput('COND')
        .setCheck('Boolean')
        .appendField(pl ? 'Czekaj aż' : 'Wait until');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(35);
    },
  };

  Blockly.Blocks['wedo_forever'] = {
    init() {
      this.appendDummyInput().appendField(pl ? 'Powtarzaj zawsze' : 'Repeat forever');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(35);
    },
  };

  Blockly.Blocks['wedo_log'] = {
    init() {
      this.appendValueInput('MSG').appendField(pl ? 'Wypisz do konsoli' : 'Log to console');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(230);
    },
  };
}
