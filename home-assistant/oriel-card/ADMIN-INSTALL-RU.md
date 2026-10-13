# Oriel card для Home Assistant — инструкция администратору

## Что устанавливается

`oriel-card.js` — это **read-only Lovelace custom card**. Она отображается на
обычном Home Assistant dashboard, а не создаёт новую интеграцию, пользователя,
API token или путь управления устройствами.

Карточка читает только состояния, уже переданные Home Assistant в браузер
авторизованного пользователя (`hass.states`). При явно включённом
`statistics.history: true` она дополнительно делает read-only запрос к
Recorder **внутри того же Home Assistant** только для утверждённых источников.
Она не вызывает services, не делает внешних запросов и не связана технически
с отдельной Oriel panel. Панель и карточку можно использовать вместе или по
отдельности.

Перед серверной установкой релиза `v=20` использовать также
[RELEASE-QA-RU.md](RELEASE-QA-RU.md): в нём есть контрольная проверка live,
Recorder, mobile и отката.

## Перед началом

1. Сделайте backup: **Settings → System → Backups**.
2. Получите файл `oriel-card.js` от Oriel из согласованного канала.
3. Убедитесь, что устанавливаете именно проверенную версию файла и что
   доступ к Home Assistant есть только у администратора объекта.

## Установка

### 1. Разместить файл

Создайте каталог и скопируйте файл:

```sh
mkdir -p /config/www/oriel
cp /путь/к/oriel-card.js /config/www/oriel/oriel-card.js
```

Можно использовать **File editor**, Samba share или Studio Code Server.
Итоговый путь должен быть строго таким:

```text
/config/www/oriel/oriel-card.js
```

В браузере Home Assistant этот файл будет доступен как:

```text
/local/oriel/oriel-card.js
```

### 2. Подключить resource

1. Откройте **Settings → Dashboards**.
2. Откройте меню `⋮` в правом верхнем углу и выберите **Resources**.
3. Нажмите **Add resource**.
4. Введите URL:

   ```text
   /local/oriel/oriel-card.js?v=20
   ```

5. Выберите **JavaScript module**.
6. Нажмите **Create**.
7. Обновите страницу браузера.

При следующем обновлении файла меняйте версию в URL, например с `?v=20` на
`?v=21`. Это снимает старую версию из browser cache.

### 3. Добавить карточку на dashboard

1. Откройте нужный dashboard.
2. Нажмите `⋮ → Edit dashboard → Add card`.
3. Выберите **Manual**.
4. Вставьте YAML ниже и нажмите **Save**.

## Рекомендуемая конфигурация Aldworth

```yaml
type: custom:oriel-card
history_weeks: 8
statistics:
  history: true
  # Текущая weekly GBP-оценка только из проверенных Recorder-дельт monetary
  # cost sources; raw current state никогда не суммируются.
  cost_history: true
  # Значение по умолчанию — Europe/London; оставляем его явно для UK estate.
  timezone: Europe/London

# В weekly-части карточки используем только подтверждённые источники.
entity_ids:
  electricity:
    # Первый ID — постоянный основной источник weekly ribbon / Recorder.
    # Не менять порядок, не сверив исторические данные.
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.house_water_1_total_l
  fuel: []
  power: []

# Эти значения нужны только для закрытого локального отображения проверенного
# архива. Каждый массив идёт от самой новой недели к более старой; позиции во
# всех массивах должны соответствовать одним и тем же неделям Mon–Sun.
# Не помещайте архив или платёжные данные в public GitHub.
archive_weekly_values:
  electricity: ["<latest_kwh>", "<previous_kwh>"]
archive_week_starts:
  electricity: ["<latest_monday_YYYY-MM-DD>", "<previous_monday_YYYY-MM-DD>"]
archive_weekly_recorded_days:
  electricity: ["<complete_days_latest>", "<complete_days_previous>"]

# Только для проверенного cost-source, который действительно относится к
# выбранному meter. Для Aldworth это три явно перечисленные фазы House Input.
cost_entity_ids:
  electricity:
    - sensor.approved_phase_a_energy_cost
    - sensor.approved_phase_b_energy_cost
    - sensor.approved_phase_c_energy_cost
archive_weekly_costs:
  electricity: ["<latest_gbp_tariff_estimate>", "<previous_gbp_tariff_estimate>"]
archive_weekly_cost_matching_days:
  electricity: ["<matched_days_latest>", "<matched_days_previous>"]
archive_cost_source_labels:
  electricity: "Tariff estimate · Home Assistant published · approved meter phases"
archive_source_details:
  electricity:
    - role: "Approved meter"
      label: "House Input"
      entity_id: sensor.approved_house_input_energy
    - role: "Tariff component"
      label: "Energy cost · phase A"
      entity_id: sensor.approved_phase_a_energy_cost
archive_anchor: "2026-09-19T12:00:00.000Z"
archive_timezone: Europe/London
```

`archive_week_starts` — наиболее проверяемый вариант: задайте для каждой
строки фактический британский понедельник, без пропусков и дублей. Невалидная
дата, не-понедельник, разрыв, повтор либо несовпадение длины/порядка массивов
означают, что импортированная история будет скрыта, а не показана как ноль.
Если этого массива нет, `archive_anchor` и `archive_timezone` вычисляют недели
с понедельника по воскресенье, например `14–20 Sept 2026`.

### Live state, текущая неделя и закрытый архив — разные данные

Сверху карточки **Live now** показывает текущее state approved source из
`hass.states`; это не расход за неделю. При `statistics.history: true` карточка
запрашивает Recorder только у **первого** approved ID в
`entity_ids.<system>`. Этот порядок намеренно фиксирован: основной weekly
meter не должен автоматически заменяться secondary feeder, когда меняется
доступность состояний.

По умолчанию и Recorder, и архив считают неделю в `Europe/London`: с 00:00
понедельника до конца воскресенья, включая переходы BST. **This UK week ·
Recorder** появляется только если у накопительного счётчика есть baseline до
начала недели и более поздняя валидная точка. Одна точка, reset счётчика,
пробел в истории или отсутствие прав дают `No record` / предупреждение, а не
абсолютный счётчик или выдуманный ноль.

Если заданы `archive_weekly_values`, это импортированный закрытый архив.
Live state и текущая неделя из Recorder остаются отдельными от ленты архива:
карточка специально не склеивает и не дописывает их в один ряд без проверки
хронологии и coverage.

При `statistics.cost_history: true` и точных `cost_entity_ids` карточка также
может показать отдельный **This UK week · tariff estimate**. Она использует
только Recorder-дельты всех approved monetary cumulative counters; сумма их
текущих `state` никогда не используется, потому что такой counter может
reset-иться. Если хотя бы один компонент не даёт проверяемую baseline/terminal
пару, имеет reset/gap или недоступен, GBP честно остаётся `Withheld`.

### Что отображает новая weekly-card

Карточка повторяет нативный Oriel weekly-ribbon: есть выбранная focus-week,
вертикальная лента недель с жёлтой линией фокуса, UK Mon–Sun даты и список
источников, реально использованных для цифр. Нажатие на строку недели меняет
весь focus-блок; **Oldest** и **Latest** быстро перемещают по истории.

Деньги показываются только при одновременном наличии:

1. согласованного с **каждой** отображаемой usage-неделей `archive_weekly_costs`;
2. явно перечисленных `cost_entity_ids`;
3. количества совпавших дней в `archive_weekly_cost_matching_days`;
4. корректной подписи источника в `archive_cost_source_labels`.

Если хотя бы один из этих элементов отсутствует или длины массивов не
совпадают, карточка оставляет ряд в kWh/L и пишет `tariff estimate withheld`;
она не превращает неподтверждённое число в GBP.

Если monetary sensor построен Home Assistant из тарифа, подпись должна быть
`Tariff estimate` или `Home Assistant published tariff cost`, а не invoice,
cash, payment или фактическая оплата. Отсутствующий план карточка показывает
как `No approved plan`; она не генерирует Plan / Fact / Cash / efficiency из
потребления. При появлении отдельного проверенного финансового набора можно
добавить синхронный массив `archive_weekly_plan_costs` (GBP).

`archive_source_details` — необязательный блок для private archive playback.
Он показывает имя и entity ID проверенного архивного источника в отдельной
тестовой инсталляции, где этот источник не обязан быть текущим live-state;
карточка при этом не придумывает для него актуальное значение.

### Необязательная разбивка по измеренным источникам

Под focus-week можно добавить раскрываемый список **Measured source
breakdown**. Он нужен для реальных, заранее подтверждённых meter/feeder
sources: например, отдельных фидеров House / Pool / Garage внутри одного
House Input либо независимых water meters. Это не автоматический поиск
«похожих» сенсоров и не попытка угадать помещения.

```yaml
source_breakdowns:
  electricity:
    title: "Where electricity was metered"
    open: false
    note: "Компоненты показываются только после подтверждения схемы счётчиков."
    sources:
      - entity_id: sensor.APPROVED_HOUSE_FEEDER_ENERGY
        label: House
        relation: part_of_total
        archive_weekly_values: ["<latest_kwh>", "<previous_kwh>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
      - entity_id: sensor.APPROVED_POOL_FEEDER_ENERGY
        label: Pool
        relation: part_of_total
        archive_weekly_values: ["<latest_kwh>", "<previous_kwh>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
  water:
    title: "Independent water meters"
    note: "Эти meters показаны отдельно и не складываются в один итог."
    sources:
      - entity_id: sensor.APPROVED_LODGE_WATER_METER
        label: Lodge Water
        relation: independent
        archive_weekly_values: ["<latest_litres>", "<previous_litres>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
```

`source_breakdowns` — отдельный явный allowlist: source ID уже согласован в
этом блоке, поэтому его не нужно дублировать в `entity_ids`. Нельзя добавлять
в него source «по названию», только после approval владельца и проверки
физической топологии.

Каждый `archive_weekly_values` в source breakdown обязан иметь ту же длину и
тот же порядок недель, что и основной `archive_weekly_values` системы. Если
добавлен `archive_week_starts`, каждый UK Monday должен совпадать с Monday
основной строки на той же позиции. При несовпадении история показывается как
`No aligned archive history`, а не как ноль.

`relation: independent` (значение по умолчанию) никогда не суммируется с
основным total. `relation: part_of_total` разрешает показать долю в процентах
только если **все** компоненты за выбранную неделю имеют совпадающее число
recorded days и их сумма сходится с total в допустимой погрешности округления.
Карточка не распределяет tariff estimate / GBP / invoice / cash между
источниками.

Если private archive arrays не добавлены, раскрытие dropdown при
`statistics.history: true` создаёт read-only Recorder request только для явно
перечисленных sources (не более 16). Закрытый dropdown ничего дополнительно не
запрашивает; весь каталог сенсоров не сканируется.

## Безопасный вариант для ограниченной аудитории

**Не** добавляйте `show_catalog: true` на dashboard инвестора,
гостя, tenant или подрядчика. Режим полного каталога может показывать
состояния personal devices и технические network/device-health sensors.

Для ограниченной аудитории используйте исключительно точные entity IDs:

```yaml
type: custom:oriel-card
entity_ids:
  electricity:
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.house_water_1_total_l
  fuel: []
  power: []
```

Карточка при этом отображает только согласованные источники и не подставляет
вместо отсутствующего состояния ноль или оценку. Если `entity_ids` не
перечислены явно, weekly-card не ищет «похожие» сенсоры автоматически и
показывает отсутствие approved source.

## Проверка после установки

- В карточке есть вкладки Electricity, Water, Fuel, Power.
- `Live now` и список Sources совпадают с соответствующими entity в
  **Developer tools → States**.
- При `statistics.history: true` проверить две Recorder-недели: расход должен
  быть только при валидной cumulative history; `No record` не заменяется нулём.
- `Unavailable` остаётся `Unavailable`; не появляется выдуманное число.
- Нажатие на карточку не меняет состояние устройства.
- В browser Network нет внешних запросов от `oriel-card.js`.

## Обновление и откат

**Обновление:** замените `/config/www/oriel/oriel-card.js`, увеличьте
параметр версии в resource URL (например, с `?v=20` на `?v=21`) и обновите
браузер.

**Откат:** верните предыдущий JS-файл из Home Assistant backup или из
проверенной версии, поменяйте URL на предыдущую версию и обновите браузер.
Чтобы полностью убрать карточку, удалите её через **Edit dashboard**; затем,
если она больше нигде не применяется, удалите resource в
**Settings → Dashboards → Resources**.
