# Aldworth → Vitaliy: пакет установки Oriel card

Этот пакет даёт одну чистую Oriel-карточку для обычного dashboard Home
Assistant. В ней остаются только подтверждённые источники Aldworth, историческая
лента по британским неделям, проверенная архивная оценка тарифа в GBP и текущие
состояния из самого Home Assistant. Это **не** каталог из сотен сенсоров, не
панель управления и не отдельный сервер.

## Что передаётся Виталию

| Элемент | Канал | Для чего |
| --- | --- | --- |
| `oriel-card.js` | публичный release-файл | frontend-код карточки |
| `ALDWORTH-ADMIN-HANDOFF-RU.md` | публично | эта инструкция и приёмочные проверки |
| `aldworth-card.yaml` | **закрытый канал только администратору** | согласованные entity ID, закрытая история, coverage и tariff estimates |

Закрытый YAML намеренно не хранится в публичном репозитории. В нём есть
история потребления, структура измерителей и денежные оценки объекта. Не
прикреплять его к public GitHub issue, открытому чату, скриншоту или ссылке без
контроля доступа.

## Identity release

- Release: **v20**
- Resource: `/local/oriel/oriel-card.js?v=20`
- SHA-256: `9384ae6d4b42004225b4b18954c16df2e0b471e04dc3c62b8627d4238f8a588e`
- Size: `78586` bytes
- Exact public asset: [download `oriel-card.js` v20](https://raw.githubusercontent.com/serobkhachatryan-cpu/estate-home-landing/oriel-card-v20/home-assistant/oriel-card/oriel-card.js)
- Read-only release folder: [open v20 on GitHub](https://github.com/serobkhachatryan-cpu/estate-home-landing/tree/oriel-card-v20/home-assistant/oriel-card)

После копирования Виталию нужно сверить файл, не доверяя имени файла:

```sh
sha256sum /config/www/oriel/oriel-card.js
```

Полный release manifest: [RELEASE-v20.md](RELEASE-v20.md).

## Что будет видно после установки

- **Electricity**: текущий показанный Home Assistant state House Input;
- **This UK week · Recorder**: текущий расход с понедельника 00:00 до момента
  последней валидной точки Recorder, если есть baseline и нет reset/gap;
- **This UK week · tariff estimate**: отдельная текущая оценка в GBP из
  Recorder-дельт всех утверждённых monetary cost sources; она скрывается, если
  хотя бы один компонент неполный, reset или не является cumulative counter;
- закрытая вертикальная лента **Mon–Sun** с архивными неделями;
- **Tariff estimate** в GBP только для тех архивных недель, для которых есть
  согласованные published cost sources и дни покрытия;
- раскрываемая разбивка по подтверждённым feeder/meter источникам: House,
  Pool, Garage, отдельные independent feeders и независимые water meters;
- текущие состояния этих источников, если они существуют на сервере Виталия;
- **Water** с текущим состоянием и историей; Fuel и Power остаются пустыми,
  пока не будут утверждены их primary entity ID.

`Tariff estimate` — это опубликованная Home Assistant оценка тарифа, а не
invoice, cash payment или бухгалтерски подтверждённый расход.

## 1. Установить ровно один frontend resource

1. Сделать backup: **Settings → System → Backups**.
2. Скачать проверенный `oriel-card.js` из release-источника.
3. На сервере сохранить прежнюю версию и поместить новую:

   ```sh
   mkdir -p /config/www/oriel
   test ! -f /config/www/oriel/oriel-card.js || \
     cp -p /config/www/oriel/oriel-card.js /config/www/oriel/oriel-card.js.previous
   cp /share/oriel-card.js /config/www/oriel/oriel-card.js
   ```

   `/share/oriel-card.js` — это пример входного пути; заменить его на путь,
   куда был передан release-файл.
4. В **Settings → Dashboards → Resources** оставить ровно один resource:

   ```text
   /local/oriel/oriel-card.js?v=20
   ```

   Тип: **JavaScript module**. Если выпуск имеет другой номер, использовать
   номер из его release manifest, а не держать два resource с `oriel-card`.
5. Открыть dashboard в private window или выполнить hard refresh.

Никакой файл не кладётся в `custom_components`: это Lovelace frontend resource,
а не backend integration.

## 2. Добавить одну карточку, а не демо-набор

1. Открыть обычный редактируемый Lovelace dashboard, например `Estate
   overview`. Не использовать автоматически созданный Home Assistant
   Overview, если он не позволяет добавить Manual card.
2. **Edit dashboard → Add card → Manual**.
3. Вставить полностью содержимое закрытого файла `aldworth-card.yaml`.
4. Нажать **Save**.
5. Удалить старые Oriel demo cards с того же view. В view должна остаться
   **ровно одна** `custom:oriel-card` с Aldworth YAML.

Не добавлять в этот YAML `show_catalog: true`: это покажет весь доступный
`sensor.*` каталог и противоречит цели чистой operational/investor card.

## 3. До нажатия Save — проверить привязки entity

В закрытом YAML уже зафиксированы проверенные primary sources:

```yaml
entity_ids:
  electricity:
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.house_water_1_total_l
  fuel: []
  power: []
```

Актуальные monetary sources для Electricity перечислены в
`cost_entity_ids.electricity`. Их нельзя заменять на «похожий» sensor по
названию. В **Developer tools → States** Виталий должен подтвердить, что
approved source существует и его единица измерения соответствует карточке.

Если конкретного historical feeder больше нет на сервере, он остаётся
архивной строкой с прозрачным объяснением, но не получает выдуманное live
значение. Не удалять primary sensor из списка ради того, чтобы убрать
предупреждение: сначала подтвердить замену и историю.

## 4. Что именно считается live

Карточка не передаёт token и не вызывает device services.

- **Live now** — текущее Home Assistant состояние approved primary entity,
  уже доступное авторизованной сессии.
- **This UK week · Recorder** — накопленное изменение approved cumulative
  meter с UK Monday 00:00 (`Europe/London`) до последней валидной Recorder
  точки. Если не хватает baseline, была замена/reset счётчика, history gap или
  прав на Recorder, будет честное `No verified use`/`Withheld`, а не ноль.
- **This UK week · tariff estimate** появляется только при
  `statistics.cost_history: true` и только когда все утверждённые monetary
  counters дают согласованную проверяемую Recorder-дельту за текущую неделю.
  Карточка никогда не складывает их текущие `state`: такие счётчики могут
  reset-иться. При любом missing/reset/gap компоненте GBP будет `Withheld`.
- Текущая неделя не вклеивается в закрытый импортированный архив: она всегда
  видна отдельно, чтобы неполная неделя не выглядела как закрытая.
- GBP в архивной ленте — только `Tariff estimate`, не фактическая оплата.
  Отсутствие проверенного cost coverage скрывает GBP, а не заменяет его
  расчётом из произвольного тарифа.

## 5. Приёмка на сервере Виталия

- [ ] В browser Console нет `Custom element doesn't exist: oriel-card`.
- [ ] Одна Oriel card, один resource и никакой второй demo-card на view.
- [ ] В Electricity `Live now` совпадает с
  `sensor.shellypro3em_9454c5b9da04_energy` в Developer tools → States.
- [ ] `This UK week · tariff estimate` либо показывает GBP и время `Recorder
  through …`, либо честно `Withheld`; он никогда не равен сумме текущих cost
  state из Developer tools.
- [ ] В Water `Live now` совпадает с `sensor.house_water_1_total_l`.
- [ ] Вкладки Electricity, Water, Fuel и Power нажимаются; пустой Fuel/Power
  честно сообщают отсутствие approved source.
- [ ] Исторические строки отображают начало и конец недели `Mon–Sun`; клик по
  строке меняет focus week без обязательной прокрутки к другому блоку.
- [ ] GBP подписан `Tariff estimate`, не `invoice`, `cash` или `payment`.
- [ ] Нажатие на live source открывает native Home Assistant more-info;
  archive-only detail открывается в ясном окне внутри карточки.
- [ ] Нет внешних запросов, service calls, токенов или бесконечного spinner.
- [ ] Проверено в Home Assistant Companion/mobile: нет горизонтального
  overflow, tabs и modal доступны пальцем.

## 6. Важное ограничение по 510 сенсорам

Эта карточка специально **не** просматривает и не отображает все 510
сенсоров. Для weekly calculations она читает только точный allowlist из
YAML, а раскладка использует только явно согласованные breakdown sources.
Это делает интерфейс читаемым и предотвращает подмену total случайным
feeder/diagnostic sensor.

Если Виталию нужен отдельный engineering inventory, он может создать другую,
админскую карточку с `show_catalog: true`. Её нельзя ставить на investor,
guest или tenant dashboard и нельзя использовать как источник расчёта.

## 7. Rollback

Если QA не пройден:

```sh
test -f /config/www/oriel/oriel-card.js.previous && \
  cp -p /config/www/oriel/oriel-card.js.previous /config/www/oriel/oriel-card.js
```

После этого вернуть предыдущий query version в resource URL и выполнить hard
refresh. Закрытый Aldworth YAML не удалять, пока не зафиксированы причина
отката и точная версия файла.

Полный технический контрольный список: [RELEASE-QA-RU.md](RELEASE-QA-RU.md).
