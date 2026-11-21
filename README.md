# WeDo 2.0 Studio — Web Bluetooth IDE

Nowoczesna aplikacja webowa (100% statyczna, gotowa pod **GitHub Pages**) do programowania i sterowania zestawami **LEGO WeDo 2.0** bezpośrednio z przeglądarki przez **Web Bluetooth API** — bez instalowania sterowników i bez serwera.

## Tryby pracy

1. **Proste klocki ikonowe** — szybkie budowanie sekwencji i **równoległych wątków** reagujących na konkretne wartości odległości (`<`, `>`, `pomiędzy np. 3.0–6.0`), przechył, wstrząs oraz przycisk Hubu.
2. **Blockly (zaawansowane klocki)** — pełne środowisko blokowe ze zmiennymi, funkcjami, matematyką, pętlami, płynnym rozruchem silnika, zdarzeniami równoległymi oraz **eksportem do kodu Python**.
3. **Python 3 (Pyodide)** — prawdziwy Python 3 uruchamiany bezpośrednio w przeglądarce z dedykowaną biblioteką `wedo` (`motor`, `ramp_motor`, `distance`, `tilt_x`, `led_rgb`, `tone`, `melody`, `on_distance`, `on_button`).
4. **Sterowanie ręczne i Telemetria na żywo** — wykresy odległości i kątów przechyłu w czasie rzeczywistym, sztuczny horyzont 2D, przełączanie trybów czujników, kontroler silnika (hamulec/luz), studio kolorów RGB oraz pianino piezo.
5. **Wbudowany Symulator WeDo 2.0** — testuj wszystkie programy (klocki, Blockly i Pythona) bez podłączonego fizycznego zestawu!

## Zaawansowana obsługa sprzętu LEGO WeDo 2.0

- **Czujnik odległości (Motion Sensor):** odczyt zmiennoprzecinkowy `0.0–10.0` (tryb SI, wyższa rozdzielczość + przybliżenie w cm) oraz tryb **zliczania obiektów** (`count`).
- **Czujnik przechyłu (Tilt Sensor):** dokładne kąty osi **X i Y (-45° do +45°)**, kierunki dyskretne oraz **detekcja wstrząsu/uderzenia** (`crash`).
- **Silnik:** pełna skala mocy `-100..+100`, rozróżnienie **hamulca (0x7F)** od **luzu (0x00)**, płynne rozpędzanie/hamowanie (`ramp`).
- **Hub:** dowolny kolor **RGB (0–255)** + 10 kolorów palety LEGO, głośnik piezo (dowolna częstotliwość w Hz, nuty, gotowe melodie), przycisk Hubu, poziom baterii i automatyczne wykrywanie portów A/B.

## Wymagania przeglądarki (Web Bluetooth)

- **Windows / macOS / Linux / Android / ChromeOS:** Google Chrome, Microsoft Edge lub Opera (strona musi być otwarta przez **HTTPS**, np. GitHub Pages, albo `http://localhost`).
- **iOS / iPadOS:** przeglądarka Bluefy (Web Bluetooth) lub tryb Symulatora w Safari.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Testy jednostkowe protokołu BLE i budowanie produkcyjne:

```bash
npm test
npm run build
```

## Publikacja na GitHub Pages (3 kroki)

1. Utwórz nowe repozytorium na GitHub i wypchnij kod na gałąź `main`.
2. Wejdź w **Settings → Pages → Build and deployment → Source** i wybierz **GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` automatycznie zbuduje i opublikuje aplikację pod adresem `https://<twoj-login>.github.io/<nazwa-repo>/`.
