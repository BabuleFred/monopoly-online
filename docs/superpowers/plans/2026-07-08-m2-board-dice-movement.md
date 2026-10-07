# Веха 2: Поле + кубики + движение — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** После старта игры игроки получают деньги и позиции, видят классическое квадратное поле, могут бросать кубики и двигаться по клеткам.

**Architecture:** Сервер остаётся источником истины. `server/board.js` хранит описание 40 клеток. `server/game.js` создаёт начальное состояние и выполняет бросок/движение. `server/messages.js` принимает `rollDice` и рассылает `gameState`. Клиент рисует поле на Canvas из состояния сервера.

**Tech Stack:** Node.js, node:test, WebSocket, HTML Canvas.

---

## Files

- Create `server/board.js` — данные поля.
- Create `server/game.js` — старт игры, бросок кубиков, движение.
- Modify `server/rooms.js` — использовать `startRoomGame(room)`.
- Modify `server/messages.js` — добавить `rollDice`.
- Create `test/board.test.js` — тесты поля.
- Create `test/game.test.js` — тесты начального состояния и движения.
- Modify `test/messages.test.js` — тест rollDice через протокол.
- Create `public/board.js` — отрисовка поля Canvas.
- Modify `public/index.html`, `public/style.css`, `public/ui.js` — игровой экран.

## Tasks

### Task 1: Board data
- [ ] Test: board has 40 cells, positions 0-39, key Russian names and types.
- [ ] Implement `server/board.js` with 40 cells.
- [ ] Run `npm test`.
- [ ] Commit.

### Task 2: Game start state
- [ ] Test: `startRoomGame(room)` gives players money=1500, position=0, bankrupt=false, current player, turnPhase='roll', dice=null.
- [ ] Implement `server/game.js` start state.
- [ ] Modify `rooms.startGame` to call it.
- [ ] Run `npm test`.
- [ ] Commit.

### Task 3: Dice and movement
- [ ] Test: `rollDiceForPlayer(room, playerId, rng)` only current player can roll; moves by sum; passing Start gives +200; landing on 30 sends to jail position 10.
- [ ] Implement dice/movement.
- [ ] Run `npm test`.
- [ ] Commit.

### Task 4: WebSocket rollDice
- [ ] Test: `handleMessage({type:'rollDice'})` broadcasts updated `gameState`.
- [ ] Implement in `messages.js`.
- [ ] Run `npm test`.
- [ ] Commit.

### Task 5: Client board UI
- [ ] Add Canvas board to game screen.
- [ ] Add Roll Dice button, current-player panel, dice display, player money/position list.
- [ ] Draw square board and player tokens in `public/board.js`.
- [ ] Smoke-test HTTP + WS flow.
- [ ] Commit.

## Verification

- `npm test` must pass.
- Start server, create room, join second player, start game, roll dice via WebSocket, verify state changes.
- Open `http://localhost:3000`, game screen contains Canvas and roll button.
