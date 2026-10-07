# Веха 3: Покупка собственности + налоги + аренда — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Игрок после броска может купить свободную собственность; попадание на чужую собственность списывает аренду; налоги списываются сразу.

**Architecture:** Сервер остаётся источником истины. `game.js` расширяется land-логикой, `messages.js` принимает `buyProperty`, `declineBuy`, `endTurn`. Клиент показывает кнопки покупки/отказа и деньги игроков.

**Tech Stack:** Node.js, node:test, WebSocket, HTML/CSS/JS.

## Tasks

1. TDD: land on unowned purchasable sets `pendingPurchase` and keeps current player in `action` phase.
2. TDD: `buyProperty` subtracts money, sets owner, clears pending purchase, advances turn.
3. TDD: `declineBuy`/`endTurn` clears pending and advances turn.
4. TDD: tax cells subtract fixed amount and advance turn.
5. TDD: owned property charges base rent to owner and advances turn.
6. WebSocket: add `buyProperty`, `declineBuy`, `endTurn` handlers.
7. Client UI: show buy/decline/end controls when appropriate.
8. Verify tests and smoke flow.
