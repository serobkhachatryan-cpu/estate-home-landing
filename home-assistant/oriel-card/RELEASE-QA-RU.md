# Oriel card — release-передача и QA для Vitaliy

Этот документ — короткий runbook для установки **проверенной сборки `v=20`**
на сервер Home Assistant. Карточка read-only: она показывает состояния и
историю, но не вызывает services и не управляет устройствами.

## Что должно быть передано

- файл `oriel-card.js` из согласованной release-сборки;
- номер release: `v=20`;
- SHA-256 файла: `9384ae6d4b42004225b4b18954c16df2e0b471e04dc3c62b8627d4238f8a588e`;
- согласованный YAML карточки с **точными** approved `entity_id`;
- при необходимости — закрытый архивный YAML. Не передавать его через public
  GitHub, в чат с посторонними людьми или в screenshot.

В пакет не должны входить Home Assistant long-lived tokens, логины, IP-адреса,
Recorder database, полный sensor dump или платёжные документы.

## 1. Безопасная установка

1. Сделать Home Assistant backup: **Settings → System → Backups**.
2. Открыть локальный terminal/File editor на сервере и сохранить предыдущую
   версию файла:

   ```sh
   mkdir -p /config/www/oriel
   test ! -f /config/www/oriel/oriel-card.js || \
     cp -p /config/www/oriel/oriel-card.js /config/www/oriel/oriel-card.js.pre-v20-backup
   cp /share/oriel-card.js /config/www/oriel/oriel-card.js
   sha256sum /config/www/oriel/oriel-card.js
   ```

   Путь `/share/oriel-card.js` — пример: заменить его на место, куда был
   загружен проверенный файл. Сверить выведенную SHA-256 с переданной для
   release `v=20`.

3. В **Settings → Dashboards → Resources** создать или отредактировать
   **один** ресурс:

   ```text
   /local/oriel/oriel-card.js?v=20
   ```

   Тип ресурса: **JavaScript module**. Не оставлять одновременно старый и
   новый resource для той же карточки. Смена `v=19` на `v=20` обязательна:
   она обходит browser cache.
4. Выполнить hard refresh в браузере (или открыть dashboard в private window).
   После обновления ресурса не требуется перезапуск Home Assistant.

## 2. Минимальная серверная конфигурация

В ручной карточке Lovelace используются только сущности, утверждённые для
этого dashboard. Первый ID в каждом списке — основной источник weekly-history;
не менять его порядок без проверки данных.

```yaml
type: custom:oriel-card
history_weeks: 8
statistics:
  history: true
  cost_history: true # only for approved cumulative monetary cost counters
  timezone: Europe/London
entity_ids:
  electricity:
    - sensor.APPROVED_ELECTRICITY_TOTAL
  water:
    - sensor.APPROVED_WATER_TOTAL
  fuel: []
  power: []
```

Заменить только `APPROVED_*` на реальные согласованные ID. Пустой список
означает «нет подтверждённого источника», а не нулевое потребление.

## 3. Обязательная проверка live и Recorder

### Live current state

Для каждого включённого system открыть **Developer tools → States**, записать
текущее значение approved entity и сравнить с верхним live-снимком и списком
источников карточки. Значения и единицы должны совпадать; `unknown` или
`unavailable` должны остаться именно такими, а не превратиться в ноль.

Карточка получает текущие состояния из уже авторизованной Home Assistant
сессии. Токен в YAML для этого не нужен и добавлять его нельзя.

### Recorder history

При `statistics.history: true` пользователь должен иметь право читать
выбранные entities и историю Recorder. На сервере должны быть включены
Recorder и запись истории для этих entities. Для накопительного счётчика
недельный расход можно вычислить только когда в пределах недели есть минимум
две валидные точки; после reset счётчика или пробела карточка обязана показать
`No record`, а не абсолютное показание или `0`.

Проверка: переключить вкладку system, выбрать две разные недели и убедиться,
что в Console/Network нет `401`, `403`, websocket error и бесконечной загрузки.
Если история недоступна, сначала исправить права/Recorder, а не заменять её
вручную числом в UI.

### Current tariff estimate (v20)

`statistics.cost_history: true` включает отдельную строку **This UK week ·
tariff estimate**. Карточка делает только read-only Recorder запросы к
явно перечисленным `cost_entity_ids.<system>` (максимум 8 компонентов).

GBP появляется только если **каждый** компонент:

- присутствует в авторизованной Home Assistant сессии;
- является monetary (`device_class: monetary` или `GBP`/`£` unit);
- имеет `state_class: total_increasing`;
- имеет baseline до UK Monday, более позднюю Recorder-точку и не имеет reset
  между ними.

Компоненты сводятся к их последнему общему timestamp Recorder. Карточка
никогда не складывает raw current `state` cost sensors. Если любой компонент
missing, reset, не cumulative, неполный или Recorder недоступен, GBP должен
остаться `Withheld` / `No verified estimate`. Это правильный результат; не
заменять его арифметикой по текущим state.

Подпись всегда означает **tariff estimate**, а не invoice, cash payment,
подтверждённый расход денег или бухгалтерский ledger.

## 4. Если подключается закрытый архив Aldworth

Перед публикацией проверить все условия:

- каждый массив идёт от новой недели к старой, одинаковой длины и относится к
  одним и тем же строкам;
- `archive_week_starts` содержит реальные UK Mondays; строки отображаются
  Mon–Sun в `Europe/London`;
- `archive_weekly_recorded_days` соответствует фактическому coverage каждой
  строки;
- total и component/room meters не смешаны: `part_of_total` показываются как
  breakdown, `independent` не суммируются в estate total;
- GBP показываются только при проверенном cost source, согласованных неделях и
  matching-days. Tariff estimate не называть invoice, cash или payment.

Сверить 3–5 произвольных недель с исходным закрытым экспортом. Архивная лента
и live-снимок должны оставаться различимыми: live-состояние не является
доказательством расхода за историческую неделю.

## 5. Smoke test перед передачей результата

- [ ] В dashboard ровно одна Oriel card нужной конфигурации; нет дублей старой
  демо-карточки или старого resource.
- [ ] Кликабельны Electricity, Water, Fuel, Power и только разрешённые
  источники / тарифные компоненты / помещения.
- [ ] Выбор недели меняет focus-week; видны дата начала и конца UK недели.
- [ ] Открытие details/modal понятно сразу, без обязательного scroll вниз;
  закрытие возвращает к той же неделе.
- [ ] Нет непрерывного spinner, layout jump или console error после refresh.
- [ ] При `cost_history: true` live GBP либо показывает согласованную
  Recorder-оценку с `Recorder through …`, либо честно `Withheld`; не равен
  сумме текущих monetary state.
- [ ] На desktop и в Home Assistant Companion / мобильном browser нет
  горизонтального overflow; все кнопки и modal нажимаются пальцем.
- [ ] Проверено ограниченной учётной записью: она видит только разрешённые
  Home Assistant entities, карточка read-only и не показывает catalogue всех
  sensors (`show_catalog` не включён).
- [ ] В Network нет сторонних запросов от карточки; допускаются только обычные
  запросы/вебсокеты к тому же Home Assistant.

Зафиксировать для release: версию, SHA-256, дату/время, dashboard URL,
проверенные entity_id и результаты desktop/mobile/limited-user тестов.

## 6. Быстрый откат

Если smoke test не пройден, вернуть backup и версию ресурса:

```sh
test -f /config/www/oriel/oriel-card.js.pre-v20-backup && \
  cp -p /config/www/oriel/oriel-card.js.pre-v20-backup /config/www/oriel/oriel-card.js
```

Затем в **Resources** вернуть URL к предыдущему номеру, например
`/local/oriel/oriel-card.js?v=19`, выполнить hard refresh и проверить, что
старый dashboard снова работает. Не удалять backup, пока release `v=20` не
принят на desktop, mobile и ограниченной учётной записи.
