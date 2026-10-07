# Монополия — мультиплеер в браузере

![Node](https://img.shields.io/badge/node-18%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![tests](https://img.shields.io/badge/tests-52%20passing-success)

Русская «Монополия» для 2–6 игроков в реальном времени. Сервер на Node.js, клиент —
обычный браузер, связь по WebSocket. Без фреймворков на фронте и без базы данных:
состояние партии живёт на сервере и восстанавливается после перезапуска.

## Как запустить

Нужен **Node.js 18+**.

```bash
npm install
npm start
```

В терминале появятся адреса:

```text
Монополия запущена. Откройте один из адресов:
  http://localhost:3000
  http://192.168.1.50:3000
```

- На этом же компьютере — `http://localhost:3000`.
- На телефоне или другом устройстве в той же сети — адрес с IP компьютера,
  например `http://192.168.1.50:3000`.

Порт можно задать вручную: `PORT=3001 npm start`.

## Игра через интернет

В комплекте два скрипта-туннеля, чтобы играть с людьми вне локальной сети:

```bash
npm run tunnel:ngrok        # нужен ngrok в PATH
npm run tunnel:cloudflared  # нужен cloudflared в PATH
```

Скрипты `start-ngrok.bat` и `start-cloudflared.bat` делают то же самое в один клик
(Windows). Сами бинарники в репозиторий не входят — поставьте их отдельно.

## Тесты

```bash
npm test
```

Покрыты доска, правила, экономика (аренда/налоги), комнаты, сетевая логика,
сохранение состояния и туннель.

## Если что-то не открывается

**С ПК:**
1. Сервер запущен командой `npm start` и не закрыт.
2. Открывать именно `http://localhost:3000`, не `https://`.
3. Порт занят — запустите на другом: `PORT=3001 npm start`.
4. Windows Firewall спросил доступ для Node.js — разрешить частные сети.

**С телефона:**
1. Телефон и ПК в одной сети Wi-Fi (мобильный интернет локальный адрес не увидит).
2. Нужен адрес вида `http://192.168.x.x:3000` — с пометкой «локальная сеть/Wi-Fi».
3. `localhost`, `198.18.x.x`, `26.x.x.x`, `172.29.x.x` не подойдут — это адаптеры ПК и VPN.
4. Разрешить Node.js в брандмауэре Windows для частных сетей.

## Как это устроено

```
server/            игровая логика и сеть (Node.js)
  index.js         точка входа: HTTP-сервер + WebSocket
  rooms.js         комнаты и лобби, подключение/отключение игроков
  game.js          ход партии: броски, движение, покупки, аренда, налоги
  board.js         доска: улицы, цвета, цены, дома и отели
  cards.js         карточки «Шанс» и «Общественная казна»
  messages.js      протокол сообщений между клиентом и сервером
  network.js       транспорт WebSocket, рассылка состояния
  persistence.js   сохранение и восстановление партии
  tunnel.js        обёртка над ngrok/cloudflared
  util.js          вспомогательные функции

public/            клиент (чистый JS, без сборки)
  index.html       разметка экрана игры
  ui.js            отрисовка доски, фишек, панелей
  net.js           WebSocket-клиент, синхронизация с сервером
  board.js         геометрия доски и раскладка клеток
  style.css        оформление
  rules.html       страница с правилами

test/              тесты (node:test), по файлу на модуль
docs/              проектные спецификация и планы этапов
```

**Ключевые решения.** Игровая логика полностью на сервере — клиент только рисует то,
что пришло, и отправляет намерения (бросить кубики, купить, построить). Это убирает
класс читов и рассинхрон: состояние одно, у сервера. Транспорт — WebSocket, протокол
описан отдельным модулем, поэтому сетевую часть можно тестировать без сокетов.

## Стек

`Node.js` · `WebSocket (ws)` · `JavaScript (ES6)` · `node:test`

## Лицензия

MIT — см. [LICENSE](LICENSE).

---

<details>
<summary>English</summary>

A real-time Russian Monopoly for 2–6 players. Node.js server + WebSocket, no front-end
framework and no database — game state lives on the server and survives restarts.

```bash
npm install && npm start   # open http://localhost:3000
npm test                   # node:test suite
```

All game logic runs server-side (the client only renders and sends intents), which keeps
state consistent and the game cheat-free. MIT licensed.

</details>
