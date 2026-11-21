export interface PythonExample {
  id: string;
  namePl: string;
  nameEn: string;
  codePl: string;
  codeEn: string;
}

export const PYTHON_EXAMPLES: PythonExample[] = [
  {
    id: 'adaptive-cruise-acc',
    namePl: 'Tempomat aktywny (ACC + włącznik na przycisk Hubu)',
    nameEn: 'Adaptive Cruise Control (ACC + Hub Button Toggle)',
    codePl: `# Tempomat aktywny (ACC) z przyciskiem Hubu (ON/OFF) i płynnym utrzymywaniem dystansu
from wedo import *

V_SET = 85          # prędkość zadana (%)
MIN_POWER = 22      # minimalna moc, żeby silnik nie utknął
STOP_DIST = 2.5     # awaryjne hamowanie (< 2.5)
FOLLOW_DIST = 7.5   # strefa dopasowania prędkości

acc_enabled = True

async def toggle_acc():
    global acc_enabled
    acc_enabled = not acc_enabled
    if acc_enabled:
        print("ACC: WŁĄCZONY")
        await tone(784, 120)
    else:
        print("ACC: WYŁĄCZONY (pauza)")
        await stop_motor(brake=True)
        await tone(392, 180)

on_button(toggle_acc)
await melody("startup")
print("Tempomat aktywny gotowy! Naciśnij przycisk Hubu, aby włączyć/wyłączyć.")

while True:
    if not acc_enabled:
        await led_rgb(40, 110, 255)
        await wait(0.08)
        continue

    d = distance()
    if d < STOP_DIST:
        await stop_motor(brake=True)
        await led_rgb(255, 20, 20)
        await tone(880, 100)
    elif d < FOLLOW_DIST:
        ratio = (d - STOP_DIST) / (FOLLOW_DIST - STOP_DIST)
        power = int(MIN_POWER + ratio * (V_SET - MIN_POWER))
        await motor(power)
        await led_rgb(255, int(60 + 180 * ratio), 0)
    else:
        await motor(V_SET)
        await led_rgb(0, 230, 80)

    await wait(0.08)
`,
    codeEn: `# Adaptive Cruise Control (ACC) with Hub Button ON/OFF toggle and smooth speed matching
from wedo import *

V_SET = 85          # target cruise speed (%)
MIN_POWER = 22      # anti-stall minimum motor power
STOP_DIST = 2.5     # emergency braking threshold
FOLLOW_DIST = 7.5   # adaptive following zone

acc_enabled = True

async def toggle_acc():
    global acc_enabled
    acc_enabled = not acc_enabled
    if acc_enabled:
        print("ACC: ENABLED")
        await tone(784, 120)
    else:
        print("ACC: PAUSED")
        await stop_motor(brake=True)
        await tone(392, 180)

on_button(toggle_acc)
await melody("startup")
print("ACC ready! Press Hub button to toggle ON/OFF.")

while True:
    if not acc_enabled:
        await led_rgb(40, 110, 255)
        await wait(0.08)
        continue

    d = distance()
    if d < STOP_DIST:
        await stop_motor(brake=True)
        await led_rgb(255, 20, 20)
        await tone(880, 100)
    elif d < FOLLOW_DIST:
        ratio = (d - STOP_DIST) / (FOLLOW_DIST - STOP_DIST)
        power = int(MIN_POWER + ratio * (V_SET - MIN_POWER))
        await motor(power)
        await led_rgb(255, int(60 + 180 * ratio), 0)
    else:
        await motor(V_SET)
        await led_rgb(0, 230, 80)

    await wait(0.08)
`,
  },
  {
    id: 'proportional-pid',
    namePl: 'Regulator prędkości od odległości (P-controller)',
    nameEn: 'Distance-Proportional Speed Controller',
    codePl: `# Płynne hamowanie proporcjonalne do dokładnej odległości (0.0 – 10.0)
from wedo import *

TARGET_STOP = 2.2   # twardy stop poniżej 2.2 (~3.3 cm)
SLOW_ZONE = 6.5     # strefa zwalniania

await melody("startup")
print("Start regulatora odległości...")

while True:
    d = distance()
    if d < TARGET_STOP:
        await stop_motor(brake=True)
        await led_rgb(255, 20, 20)
        await tone(880, 120)
    elif d < SLOW_ZONE:
        # Skaluj moc płynnie od 25% do 85%
        ratio = (d - TARGET_STOP) / (SLOW_ZONE - TARGET_STOP)
        power = int(25 + ratio * 60)
        await motor(power)
        # Płynna zmiana koloru LED od czerwonego do zielonego
        await led_rgb(int(255 * (1 - ratio)), int(220 * ratio), 0)
    else:
        await motor(95)
        await led_rgb(0, 230, 90)

    await wait(0.08)
`,
    codeEn: `# Smooth braking proportional to exact floating-point distance (0.0 – 10.0)
from wedo import *

TARGET_STOP = 2.2   # hard brake below 2.2 (~3.3 cm)
SLOW_ZONE = 6.5     # deceleration zone

await melody("startup")
print("Distance controller started...")

while True:
    d = distance()
    if d < TARGET_STOP:
        await stop_motor(brake=True)
        await led_rgb(255, 20, 20)
        await tone(880, 120)
    elif d < SLOW_ZONE:
        ratio = (d - TARGET_STOP) / (SLOW_ZONE - TARGET_STOP)
        power = int(25 + ratio * 60)
        await motor(power)
        await led_rgb(int(255 * (1 - ratio)), int(220 * ratio), 0)
    else:
        await motor(95)
        await led_rgb(0, 230, 90)

    await wait(0.08)
`,
  },
  {
    id: 'theremin',
    namePl: 'Instrument Theremin (dźwięk + kolor RGB z odległości)',
    nameEn: 'Distance Theremin (Pitch & RGB from Distance)',
    codePl: `# Przesuwaj dłoń nad czujnikiem odległości — wysokość tonu i kolor LED zmieniają się płynnie!
from wedo import *

print("Theremin gotowy! Zbliż dłoń do czujnika (< 9.0).")

while True:
    d = distance()
    if d < 9.0:
        # Mapuj 0.0..9.0 -> 262 Hz (C4) .. 1047 Hz (C6)
        freq = int(262 + (d / 9.0) * 785)
        r = int(max(0, 255 - d * 28))
        b = int(min(255, d * 28))
        await led_rgb(r, 40, b)
        await tone(freq, 130)
    else:
        await led_rgb(20, 40, 80)
        await wait(0.08)
`,
    codeEn: `# Move your hand above the motion sensor — pitch and LED RGB respond smoothly!
from wedo import *

print("Theremin ready! Bring your hand closer (< 9.0).")

while True:
    d = distance()
    if d < 9.0:
        freq = int(262 + (d / 9.0) * 785)
        r = int(max(0, 255 - d * 28))
        b = int(min(255, d * 28))
        await led_rgb(r, 40, b)
        await tone(freq, 130)
    else:
        await led_rgb(20, 40, 80)
        await wait(0.08)
`,
  },
  {
    id: 'tilt-steering',
    namePl: 'Proporcjonalne sterowanie kątem przechyłu X',
    nameEn: 'Proportional Tilt-X Angle Steering',
    codePl: `# Przechylaj czujnik w osi X (-45° do +45°), aby płynnie sterować kierunkiem i mocą silnika
from wedo import *

await set_tilt_mode("angle")
print("Sterowanie kątem X aktywne! Przycisk Hubu zatrzymuje.")

async def emergency_stop():
    print("Przycisk Hubu -> STOP!")
    await stop_motor(brake=True)
    await melody("alarm")

on_button(emergency_stop)

while True:
    x = tilt_x()
    if abs(x) < 8:
        await stop_motor(brake=False)
        await led_rgb(40, 120, 255)
    else:
        # Skaluj -45..+45 stopni na -100..+100% mocy
        power = max(-100, min(100, int(x * 2.2)))
        await motor(power)
        if power > 0:
            await led_rgb(0, 255, 120)
        else:
            await led_rgb(220, 60, 255)
    await wait(0.08)
`,
    codeEn: `# Tilt the sensor on X axis (-45° to +45°) for smooth bidirectional motor speed
from wedo import *

await set_tilt_mode("angle")
print("Tilt-X steering active! Press Hub button for emergency stop.")

async def emergency_stop():
    print("Hub Button -> STOP!")
    await stop_motor(brake=True)
    await melody("alarm")

on_button(emergency_stop)

while True:
    x = tilt_x()
    if abs(x) < 8:
        await stop_motor(brake=False)
        await led_rgb(40, 120, 255)
    else:
        power = max(-100, min(100, int(x * 2.2)))
        await motor(power)
        if power > 0:
            await led_rgb(0, 255, 120)
        else:
            await led_rgb(220, 60, 255)
    await wait(0.08)
`,
  },
];
