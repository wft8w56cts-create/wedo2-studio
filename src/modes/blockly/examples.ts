export interface BlocklyExample {
  id: string;
  namePl: string;
  nameEn: string;
  workspace: Record<string, unknown>;
}

export const BLOCKLY_EXAMPLES: BlocklyExample[] = [
  {
    id: 'adaptive-cruise-acc',
    namePl: 'Tempomat aktywny (ACC + przycisk Hubu)',
    nameEn: 'Adaptive Cruise Control (ACC + Hub Button)',
    workspace: {
      variables: [
        { name: 'aktywny', id: 'var_acc_active' },
        { name: 'v_zadana', id: 'var_acc_vset' },
        { name: 'moc', id: 'var_acc_power' },
      ],
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'wedo_on_start',
            x: 28,
            y: 28,
            inputs: {
              DO: {
                block: {
                  type: 'variables_set',
                  fields: { VAR: { id: 'var_acc_active' } },
                  inputs: {
                    VALUE: { block: { type: 'logic_boolean', fields: { BOOL: 'TRUE' } } },
                  },
                  next: {
                    block: {
                      type: 'variables_set',
                      fields: { VAR: { id: 'var_acc_vset' } },
                      inputs: {
                        VALUE: { block: { type: 'math_number', fields: { NUM: 85 } } },
                      },
                      next: {
                        block: {
                          type: 'wedo_play_melody',
                          fields: { MELODY: 'startup' },
                          next: {
                            block: {
                              type: 'wedo_forever',
                              inputs: {
                                DO: {
                                  block: {
                                    type: 'controls_if',
                                    extraState: { hasElse: true },
                                    inputs: {
                                      IF0: {
                                        block: {
                                          type: 'variables_get',
                                          fields: { VAR: { id: 'var_acc_active' } },
                                        },
                                      },
                                      DO0: {
                                        block: {
                                          type: 'controls_if',
                                          extraState: { elseIfCount: 1, hasElse: true },
                                          inputs: {
                                            IF0: {
                                              block: {
                                                type: 'logic_compare',
                                                fields: { OP: 'LT' },
                                                inputs: {
                                                  A: { block: { type: 'wedo_get_distance' } },
                                                  B: { block: { type: 'math_number', fields: { NUM: 2.5 } } },
                                                },
                                              },
                                            },
                                            DO0: {
                                              block: {
                                                type: 'wedo_motor_stop',
                                                fields: { BRAKE: 'true', PORT: 'auto' },
                                                next: {
                                                  block: {
                                                    type: 'wedo_led_rgb',
                                                    inputs: {
                                                      R: { block: { type: 'math_number', fields: { NUM: 255 } } },
                                                      G: { block: { type: 'math_number', fields: { NUM: 20 } } },
                                                      B: { block: { type: 'math_number', fields: { NUM: 20 } } },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                            IF1: {
                                              block: {
                                                type: 'logic_compare',
                                                fields: { OP: 'LT' },
                                                inputs: {
                                                  A: { block: { type: 'wedo_get_distance' } },
                                                  B: { block: { type: 'math_number', fields: { NUM: 7.5 } } },
                                                },
                                              },
                                            },
                                            DO1: {
                                              block: {
                                                type: 'variables_set',
                                                fields: { VAR: { id: 'var_acc_power' } },
                                                inputs: {
                                                  VALUE: {
                                                    block: {
                                                      type: 'math_constrain',
                                                      inputs: {
                                                        VALUE: {
                                                          block: {
                                                            type: 'math_arithmetic',
                                                            fields: { OP: 'MULTIPLY' },
                                                            inputs: {
                                                              A: {
                                                                block: {
                                                                  type: 'math_arithmetic',
                                                                  fields: { OP: 'MINUS' },
                                                                  inputs: {
                                                                    A: { block: { type: 'wedo_get_distance' } },
                                                                    B: { block: { type: 'math_number', fields: { NUM: 2 } } },
                                                                  },
                                                                },
                                                              },
                                                              B: { block: { type: 'math_number', fields: { NUM: 16 } } },
                                                            },
                                                          },
                                                        },
                                                        LOW: { block: { type: 'math_number', fields: { NUM: 22 } } },
                                                        HIGH: {
                                                          block: {
                                                            type: 'variables_get',
                                                            fields: { VAR: { id: 'var_acc_vset' } },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                next: {
                                                  block: {
                                                    type: 'wedo_motor_power',
                                                    fields: { PORT: 'auto' },
                                                    inputs: {
                                                      POWER: {
                                                        block: {
                                                          type: 'variables_get',
                                                          fields: { VAR: { id: 'var_acc_power' } },
                                                        },
                                                      },
                                                    },
                                                    next: {
                                                      block: {
                                                        type: 'wedo_led_rgb',
                                                        inputs: {
                                                          R: { block: { type: 'math_number', fields: { NUM: 255 } } },
                                                          G: { block: { type: 'math_number', fields: { NUM: 170 } } },
                                                          B: { block: { type: 'math_number', fields: { NUM: 0 } } },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                            ELSE: {
                                              block: {
                                                type: 'wedo_motor_power',
                                                fields: { PORT: 'auto' },
                                                inputs: {
                                                  POWER: {
                                                    block: {
                                                      type: 'variables_get',
                                                      fields: { VAR: { id: 'var_acc_vset' } },
                                                    },
                                                  },
                                                },
                                                next: {
                                                  block: {
                                                    type: 'wedo_led_rgb',
                                                    inputs: {
                                                      R: { block: { type: 'math_number', fields: { NUM: 0 } } },
                                                      G: { block: { type: 'math_number', fields: { NUM: 230 } } },
                                                      B: { block: { type: 'math_number', fields: { NUM: 80 } } },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                      ELSE: {
                                        block: {
                                          type: 'wedo_motor_stop',
                                          fields: { BRAKE: 'false', PORT: 'auto' },
                                          next: {
                                            block: {
                                              type: 'wedo_led_rgb',
                                              inputs: {
                                                R: { block: { type: 'math_number', fields: { NUM: 40 } } },
                                                G: { block: { type: 'math_number', fields: { NUM: 110 } } },
                                                B: { block: { type: 'math_number', fields: { NUM: 255 } } },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: 'wedo_when_button',
            x: 560,
            y: 28,
            inputs: {
              DO: {
                block: {
                  type: 'variables_set',
                  fields: { VAR: { id: 'var_acc_active' } },
                  inputs: {
                    VALUE: {
                      block: {
                        type: 'logic_negate',
                        inputs: {
                          BOOL: {
                            block: {
                              type: 'variables_get',
                              fields: { VAR: { id: 'var_acc_active' } },
                            },
                          },
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: 'wedo_play_tone',
                      inputs: {
                        FREQ: { block: { type: 'math_number', fields: { NUM: 660 } } },
                        MS: { block: { type: 'math_number', fields: { NUM: 140 } } },
                      },
                      next: {
                        block: {
                          type: 'wedo_log',
                          inputs: {
                            MSG: { block: { type: 'text', fields: { TEXT: 'Przełączono ACC (przycisk Hubu)' } } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'proportional-speed',
    namePl: 'Prędkość proporcjonalna do odległości',
    nameEn: 'Distance-Proportional Speed',
    workspace: {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'wedo_on_start',
            x: 36,
            y: 36,
            inputs: {
              DO: {
                block: {
                  type: 'wedo_forever',
                  inputs: {
                    DO: {
                      block: {
                        type: 'controls_if',
                        extraState: { elseIfCount: 1, hasElse: true },
                        inputs: {
                          IF0: {
                            block: {
                              type: 'logic_compare',
                              fields: { OP: 'LT' },
                              inputs: {
                                A: { block: { type: 'wedo_get_distance' } },
                                B: { block: { type: 'math_number', fields: { NUM: 2.5 } } },
                              },
                            },
                          },
                          DO0: {
                            block: {
                              type: 'wedo_motor_stop',
                              fields: { BRAKE: 'true', PORT: 'auto' },
                              next: {
                                block: {
                                  type: 'wedo_led_rgb',
                                  inputs: {
                                    R: { block: { type: 'math_number', fields: { NUM: 255 } } },
                                    G: { block: { type: 'math_number', fields: { NUM: 0 } } },
                                    B: { block: { type: 'math_number', fields: { NUM: 0 } } },
                                  },
                                },
                              },
                            },
                          },
                          IF1: {
                            block: {
                              type: 'wedo_distance_between',
                              inputs: {
                                MIN: { block: { type: 'math_number', fields: { NUM: 2.5 } } },
                                MAX: { block: { type: 'math_number', fields: { NUM: 6 } } },
                              },
                            },
                          },
                          DO1: {
                            block: {
                              type: 'wedo_motor_power',
                              fields: { PORT: 'auto' },
                              inputs: {
                                POWER: {
                                  block: {
                                    type: 'math_arithmetic',
                                    fields: { OP: 'MULTIPLY' },
                                    inputs: {
                                      A: { block: { type: 'wedo_get_distance' } },
                                      B: { block: { type: 'math_number', fields: { NUM: 12 } } },
                                    },
                                  },
                                },
                              },
                              next: {
                                block: {
                                  type: 'wedo_led_rgb',
                                  inputs: {
                                    R: { block: { type: 'math_number', fields: { NUM: 255 } } },
                                    G: { block: { type: 'math_number', fields: { NUM: 180 } } },
                                    B: { block: { type: 'math_number', fields: { NUM: 0 } } },
                                  },
                                },
                              },
                            },
                          },
                          ELSE: {
                            block: {
                              type: 'wedo_motor_power',
                              fields: { PORT: 'auto' },
                              inputs: {
                                POWER: { block: { type: 'math_number', fields: { NUM: 90 } } },
                              },
                              next: {
                                block: {
                                  type: 'wedo_led_rgb',
                                  inputs: {
                                    R: { block: { type: 'math_number', fields: { NUM: 0 } } },
                                    G: { block: { type: 'math_number', fields: { NUM: 230 } } },
                                    B: { block: { type: 'math_number', fields: { NUM: 80 } } },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'distance-theremin',
    namePl: 'Theremin — dźwięk zależny od odległości',
    nameEn: 'Distance Theremin Synth',
    workspace: {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'wedo_on_start',
            x: 36,
            y: 36,
            inputs: {
              DO: {
                block: {
                  type: 'wedo_forever',
                  inputs: {
                    DO: {
                      block: {
                        type: 'controls_if',
                        inputs: {
                          IF0: {
                            block: {
                              type: 'logic_compare',
                              fields: { OP: 'LT' },
                              inputs: {
                                A: { block: { type: 'wedo_get_distance' } },
                                B: { block: { type: 'math_number', fields: { NUM: 9 } } },
                              },
                            },
                          },
                          DO0: {
                            block: {
                              type: 'wedo_play_tone',
                              inputs: {
                                FREQ: {
                                  block: {
                                    type: 'math_arithmetic',
                                    fields: { OP: 'ADD' },
                                    inputs: {
                                      A: { block: { type: 'math_number', fields: { NUM: 250 } } },
                                      B: {
                                        block: {
                                          type: 'math_arithmetic',
                                          fields: { OP: 'MULTIPLY' },
                                          inputs: {
                                            A: { block: { type: 'wedo_get_distance' } },
                                            B: { block: { type: 'math_number', fields: { NUM: 90 } } },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                                MS: { block: { type: 'math_number', fields: { NUM: 140 } } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'smooth-ramp-and-events',
    namePl: 'Płynny rozruch + zdarzenie na przycisk',
    nameEn: 'Smooth Ramp + Hub Button Event',
    workspace: {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'wedo_on_start',
            x: 36,
            y: 36,
            inputs: {
              DO: {
                block: {
                  type: 'wedo_play_melody',
                  fields: { MELODY: 'startup' },
                  next: {
                    block: {
                      type: 'wedo_motor_ramp',
                      fields: { PORT: 'auto' },
                      inputs: {
                        FROM: { block: { type: 'math_number', fields: { NUM: 20 } } },
                        TO: { block: { type: 'math_number', fields: { NUM: 100 } } },
                        SECONDS: { block: { type: 'math_number', fields: { NUM: 2 } } },
                      },
                      next: {
                        block: {
                          type: 'wedo_wait_distance',
                          fields: { OP: '<' },
                          inputs: {
                            VAL: { block: { type: 'math_number', fields: { NUM: 3.5 } } },
                          },
                          next: {
                            block: {
                              type: 'wedo_motor_stop',
                              fields: { BRAKE: 'true', PORT: 'auto' },
                              next: {
                                block: {
                                  type: 'wedo_play_melody',
                                  fields: { MELODY: 'success' },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            type: 'wedo_when_button',
            x: 420,
            y: 36,
            inputs: {
              DO: {
                block: {
                  type: 'wedo_motor_stop',
                  fields: { BRAKE: 'true', PORT: 'auto' },
                  next: {
                    block: {
                      type: 'wedo_led_preset',
                      fields: { COLOR: '9' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
];
