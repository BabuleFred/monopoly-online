// board.js — описание классического поля русской версии Монополии.

const CELLS = [
  { name: 'Старт', type: 'go' },
  { name: 'ул. Гончарная', type: 'street', colorGroup: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], housePrice: 50 },
  { name: 'Общественная казна', type: 'chest' },
  { name: 'ул. Бутырская', type: 'street', colorGroup: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], housePrice: 50 },
  { name: 'Подоходный налог', type: 'tax', amount: 200 },
  { name: 'Рижский вокзал', type: 'railroad', price: 200, rentRailroad: [25, 50, 100, 200] },
  { name: 'ул. Арбатская', type: 'street', colorGroup: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
  { name: 'Шанс', type: 'chance' },
  { name: 'ул. Покровская', type: 'street', colorGroup: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
  { name: 'ул. Ваганьцевская', type: 'street', colorGroup: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], housePrice: 50 },
  { name: 'Просто посетитель', type: 'jail' },
  { name: 'ул. Маяковская', type: 'street', colorGroup: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
  { name: 'Электростанция', type: 'utility', price: 150 },
  { name: 'ул. Тверская', type: 'street', colorGroup: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
  { name: 'ул. Сущёвская', type: 'street', colorGroup: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], housePrice: 100 },
  { name: 'Курский вокзал', type: 'railroad', price: 200, rentRailroad: [25, 50, 100, 200] },
  { name: 'ул. Полянка', type: 'street', colorGroup: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
  { name: 'Общественная казна', type: 'chest' },
  { name: 'ул. Маросейка', type: 'street', colorGroup: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
  { name: 'ул. Покровские ворота', type: 'street', colorGroup: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], housePrice: 100 },
  { name: 'Бесплатная стоянка', type: 'parking' },
  { name: 'ул. Рождественка', type: 'street', colorGroup: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
  { name: 'Шанс', type: 'chance' },
  { name: 'ул. Страстной бульвар', type: 'street', colorGroup: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
  { name: 'ул. Петровка', type: 'street', colorGroup: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], housePrice: 150 },
  { name: 'Казанский вокзал', type: 'railroad', price: 200, rentRailroad: [25, 50, 100, 200] },
  { name: 'ул. Пушкинская', type: 'street', colorGroup: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150 },
  { name: 'ул. Кузнецкий мост', type: 'street', colorGroup: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150 },
  { name: 'Водопроводная станция', type: 'utility', price: 150 },
  { name: 'ул. Мира', type: 'street', colorGroup: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], housePrice: 150 },
  { name: 'Арест', type: 'gotojail' },
  { name: 'ул. Малая Бронная', type: 'street', colorGroup: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200 },
  { name: 'ул. Остоженка', type: 'street', colorGroup: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200 },
  { name: 'Общественная казна', type: 'chest' },
  { name: 'ул. Чистые пруды', type: 'street', colorGroup: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], housePrice: 200 },
  { name: 'Ленинградский вокзал', type: 'railroad', price: 200, rentRailroad: [25, 50, 100, 200] },
  { name: 'Шанс', type: 'chance' },
  { name: 'ул. Рублёвка', type: 'street', colorGroup: 'darkblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], housePrice: 200 },
  { name: 'Налог на роскошь', type: 'tax', amount: 100 },
  { name: 'ул. Арбат', type: 'street', colorGroup: 'darkblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], housePrice: 200 }
];

function createBoard() {
  return CELLS.map((cell, pos) => ({
    pos,
    owner: null,
    houses: 0,
    mortgaged: false,
    ...cell
  }));
}

module.exports = { createBoard };
