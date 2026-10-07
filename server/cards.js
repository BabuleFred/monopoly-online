// cards.js — упрощённые колоды Шанс и Общественная казна.
const CHANCE = [
  { text: 'Банк платит вам 50₽', effect: 'money', amount: 50 },
  { text: 'Отправляйтесь на Старт', effect: 'moveTo', pos: 0 },
  { text: 'Отправляйтесь в тюрьму', effect: 'gotoJail' },
  { text: 'Освобождение из тюрьмы', effect: 'jailCard' },
  { text: 'Штраф за превышение скорости 15₽', effect: 'money', amount: -15 },
  { text: 'Получите дивиденды 50₽', effect: 'money', amount: 50 },
  { text: 'Перейдите на ул. Мира', effect: 'moveTo', pos: 29 },
  { text: 'Перейдите на ближайший вокзал', effect: 'moveTo', pos: 15 },
  { text: 'Заплатите за ремонт 25₽', effect: 'money', amount: -25 },
  { text: 'Получите 150₽', effect: 'money', amount: 150 },
  { text: 'Вернитесь на 3 клетки назад', effect: 'moveBy', steps: -3 },
  { text: 'Перейдите на ул. Арбат', effect: 'moveTo', pos: 39 },
  { text: 'Заплатите налог 20₽', effect: 'money', amount: -20 },
  { text: 'Получите 100₽', effect: 'money', amount: 100 },
  { text: 'Перейдите на Рижский вокзал', effect: 'moveTo', pos: 5 },
  { text: 'Банк ошибся в вашу пользу: получите 200₽', effect: 'money', amount: 200 }
];

const CHEST = [
  { text: 'Получите 200₽', effect: 'money', amount: 200 },
  { text: 'Заплатите больничный сбор 100₽', effect: 'money', amount: -100 },
  { text: 'Получите 50₽', effect: 'money', amount: 50 },
  { text: 'Освобождение из тюрьмы', effect: 'jailCard' },
  { text: 'Отправляйтесь в тюрьму', effect: 'gotoJail' },
  { text: 'Получите наследство 100₽', effect: 'money', amount: 100 },
  { text: 'Заплатите страховку 50₽', effect: 'money', amount: -50 },
  { text: 'Получите 25₽', effect: 'money', amount: 25 },
  { text: 'Продажа акций: получите 50₽', effect: 'money', amount: 50 },
  { text: 'Оплатите лечение 50₽', effect: 'money', amount: -50 },
  { text: 'Получите 10₽', effect: 'money', amount: 10 },
  { text: 'Заплатите 50₽', effect: 'money', amount: -50 },
  { text: 'Получите 100₽', effect: 'money', amount: 100 },
  { text: 'Отправляйтесь на Старт', effect: 'moveTo', pos: 0 },
  { text: 'Получите возврат налогов 20₽', effect: 'money', amount: 20 },
  { text: 'Заплатите 40₽', effect: 'money', amount: -40 }
];

function createChanceDeck() {
  return CHANCE.map(card => ({ ...card }));
}

function createChestDeck() {
  return CHEST.map(card => ({ ...card }));
}

module.exports = { createChanceDeck, createChestDeck };
