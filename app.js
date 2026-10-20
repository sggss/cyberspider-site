(function () {
  'use strict';

  // Данные взяты из каталога старого сайта cyberspide.clients.site
  var ZONES = [
    { id: 'common', name: 'Общий зал', tag: 'Старт', color: '#9dff3c', night: 10, nightNote: 'Ночь с 22:00 до 8:00',
      specs: ['Intel Core i5 13400KF', 'ОЗУ 16 ГБ', 'GeForce RTX 4060 Ti 8 ГБ', 'Мониторы 24″, 165 Гц (KTC и AOC)', 'Эргономичные кресла с RGB'],
      p: { weekday: { 1: 140, 3: 350, 5: 600, night: 700 }, weekend: { 1: 160, 3: 420, 5: 700, night: 750 } } },
    { id: 'vip', name: 'VIP зона', tag: 'Комфорт', color: '#29c6ff', night: 10, nightNote: 'Ночь с 22:00 до 8:00',
      specs: ['Intel Core i5 13400KF', 'ОЗУ 16 ГБ', 'GeForce RTX 4070 Ti 8 ГБ', 'Мониторы Philips 27″, 165 Гц', 'Эргономичные кресла с RGB'],
      p: { weekday: { 1: 180, 3: 470, 5: 700, night: 900 }, weekend: { 1: 220, 3: 550, 5: 900, night: 1000 } } },
    { id: 'duo', name: 'DUO', tag: 'Для двоих', color: '#ff2e63', night: 12, nightNote: '',
      specs: ['Intel Core i5 13400KF', 'ОЗУ 32 ГБ', 'GeForce RTX 4070 Ti 8 ГБ', 'Мониторы 300 Гц'],
      p: { weekday: { 1: 210, 3: 590, 5: 900, night: 1000 }, weekend: { 1: 230, 3: 650, 5: 1000, night: 1100 } } },
    { id: 'ps5', name: 'GameZone PS5', tag: 'Приставки', color: '#b78bff', night: 10, nightNote: 'Ночь с 22:00 до 8:00', single: true,
      specs: ['4 приставки Sony PlayStation 5', 'Подписки EA и PS Plus'],
      p: { all: { 1: 350, 3: 900, 5: 1200, night: 1400 } } }
  ];

  var rub = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var $ = function (id) { return document.getElementById(id); };
  var prices = function (z, day) { return z.single ? z.p.all : z.p[day]; };
  var minHour = function (z) { return Math.min(z.p.weekday ? z.p.weekday[1] : Infinity, z.p.all ? z.p.all[1] : Infinity); };

  // Залы
  $('zonesGrid').innerHTML = ZONES.map(function (z) {
    return '<article class="zone rv" style="--zc:' + z.color + '"><span class="zone__tag">' + z.tag + '</span><h3>' + z.name +
      '</h3><p class="zone__from">от <b>' + rub(minHour(z)) + '</b> / час</p><ul>' +
      z.specs.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></article>';
  }).join('');

  // Тарифы
  var state = { zone: 'common', day: 'weekday' };
  var tabs = $('zoneTabs'), dayBox = $('dayTabs');
  tabs.innerHTML = ZONES.map(function (z) {
    return '<button type="button" data-zone="' + z.id + '" aria-pressed="' + (z.id === state.zone) + '">' + z.name + '</button>';
  }).join('');

  function renderTariffs() {
    var z = ZONES.filter(function (x) { return x.id === state.zone; })[0];
    var p = prices(z, state.day);
    dayBox.hidden = !!z.single;
    $('priceSpec').textContent = z.specs.join(' · ');
    var items = [[1, '1 час', 'за 1 ч'], [3, '3 часа', 'за 3 ч'], [5, '5 часов', 'за 5 ч']];
    var html = items.map(function (it) {
      return '<div class="tariff"><span class="tariff__t">' + it[1] + '</span><span class="tariff__p">' + rub(p[it[0]]).replace(' ₽', '<small> ₽</small>') +
        '</span><span class="tariff__u">' + it[2] + (it[0] > 1 ? ' · ' + rub(Math.round(p[it[0]] / it[0])) + '/ч' : '') + '</span></div>';
    }).join('');
    html += '<div class="tariff tariff--night"><span class="tariff__t">Ночной тариф</span><span class="tariff__p">' + rub(p.night).replace(' ₽', '<small> ₽</small>') +
      '</span><span class="tariff__u">за ' + z.night + ' ч</span></div>';
    $('tariffs').innerHTML = html;
    $('priceNote').textContent = (z.nightNote ? z.nightNote + '. ' : '') + (z.single ? 'Цены на приставки не зависят от дня недели.' : 'Тарифы для будних и выходных дней различаются.');
  }

  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.zone = b.dataset.zone;
    [].forEach.call(tabs.children, function (x) { x.setAttribute('aria-pressed', x === b); });
    renderTariffs();
  });
  dayBox.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.day = b.dataset.day;
    [].forEach.call(dayBox.children, function (x) { x.setAttribute('aria-pressed', x === b); });
    renderTariffs();
  });
  renderTariffs();

  // Калькулятор: минимальная стоимость набора пакетов 1/3/5 ч, покрывающих нужное время
  var cZone = $('cZone'), cDay = $('cDay'), cHours = $('cHours');
  cZone.innerHTML = ZONES.map(function (z) { return '<option value="' + z.id + '">' + z.name + '</option>'; }).join('');

  function best(p, need) {
    var packs = [1, 3, 5], max = need + 5, dp = [0], pick = [null], i, k;
    for (i = 1; i <= max; i++) {
      dp[i] = Infinity;
      for (k = 0; k < 3; k++) {
        var h = packs[k], prev = Math.max(0, i - h), c = dp[prev] + p[h];
        if (c < dp[i]) { dp[i] = c; pick[i] = h; }
      }
    }
    var bestH = need;
    for (i = need; i <= max; i++) if (dp[i] < dp[bestH]) bestH = i;
    var cnt = { 1: 0, 3: 0, 5: 0 }, left = bestH;
    while (left > 0) { var h2 = pick[left]; cnt[h2]++; left = Math.max(0, left - h2); }
    return { cost: dp[bestH], cnt: cnt };
  }

  function calc() {
    var z = ZONES.filter(function (x) { return x.id === cZone.value; })[0];
    var need = +cHours.value, p = prices(z, cDay.value);
    $('cHoursOut').textContent = need;
    cDay.disabled = !!z.single;
    var r = best(p, need);
    $('cSum').textContent = rub(r.cost);
    $('cMix').textContent = [5, 3, 1].filter(function (h) { return r.cnt[h]; })
      .map(function (h) { return r.cnt[h] + '×' + h + ' ч'; }).join(' + ');
    $('cHint').textContent = need >= 6 && need <= z.night && p.night < r.cost
      ? 'Если играть ночью, выгоднее ночной тариф: ' + rub(p.night) + ' за ' + z.night + ' ч' + (z.nightNote ? ' (' + z.nightNote.toLowerCase() + ')' : '') + '.'
      : '';
  }
  [cZone, cDay, cHours].forEach(function (el) { el.addEventListener('input', calc); });
  calc();

  // Меню
  var burger = $('burger'), nav = $('nav');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeNav(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  // Появление при прокрутке
  var targets = document.querySelectorAll('.zone,.tariff,.calc,.gal figure,blockquote,.promo,.find');
  [].forEach.call(targets, function (t) { t.classList.add('rv'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(document.querySelectorAll('.rv'), function (t) { io.observe(t); });
  } else {
    [].forEach.call(document.querySelectorAll('.rv'), function (t) { t.classList.add('in'); });
  }
})();
