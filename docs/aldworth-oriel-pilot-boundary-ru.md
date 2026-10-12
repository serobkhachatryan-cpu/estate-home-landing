# Aldworth — жёсткие границы пилота Oriel

**Статус:** границы пилота v1.1 (для утверждения владельцем)

**Назначение:** зафиксировать, что именно Oriel делает на объекте Aldworth, какие данные ему разрешено получать, что он не делает ни при каких условиях и по какому процессу меняется объём работ.

Этот документ является основой для технического задания, доступа Home Assistant и будущего SOW. Он не заменяет договор, DPA, правила Home Assistant, требования страховщика или юридическую консультацию.

## Как читать этот документ

Это **не список желаний и не roadmap**. Это контрактная техническая граница
первого пилота: всё, что не названо в разделе «Включено», считается
невключённым до отдельного письменного Change Request. Слово «Aldworth» ниже
означает только один согласованный объект и его owner-controlled Home
Assistant instance.

## 1. Решение в одном абзаце

На Aldworth Oriel - это **два нативных read-only интерфейса внутри существующего Home Assistant**: optional sidebar panel и optional Lovelace dashboard card. Это не новый контроллер дома, не охранная система, не публичный портал и не удалённый диспетчерский центр.

Панель показывает только заранее одобренные телеметрические состояния из Home Assistant, уже доступные авторизованному пользователю. Она не вызывает сервисы Home Assistant, не меняет устройства, не создаёт автоматизации, не хранит токены, не отправляет наружу сырые данные и не открывает доступ к камерам, замкам, сигнализации или сети.

## 2. Цель пилота

Пилот должен доказать четыре вещи:

1. У владельца и управляющего есть спокойный, понятный экран текущего состояния согласованных инженерных систем.
2. Каждая цифра имеет известный источник Home Assistant, единицу измерения и время последнего обновления.
3. Система не расширяет поверхность атаки объекта и не создаёт новый путь управления домом.
4. Установка, обновление и откат panel/card повторяемы и документированы.

Пилот **не** доказывает экономию энергии, соответствие EPC/Building Regulations, снижение страховой премии, предиктивное обслуживание или готовность Oriel к масштабному внедрению в других объектах.

## 3. Границы продукта

### 3.1 Включено в Aldworth v1

| Область | Разрешённый результат |
|---|---|
| Интерфейс | Один или оба независимых нативных интерфейса: `panel_custom` Oriel в sidebar по адресу `/oriel` и `custom:oriel-card` в обычном редактируемом Lovelace dashboard. Card не читает panel и panel не читает card: оба получают states из авторизованной HA-сессии. Card может стоять рядом с нативными HA cards; system-generated `Overview` не является местом установки произвольной custom card |
| Тип данных | Текущие состояния согласованных сущностей из `hass.states`; при явном `statistics: true` — не более шести недель Recorder history primary allowlisted-сущности через уже авторизованную WebSocket-сессию HA (`history/history_during_period`, `minimal_response: true`, `no_attributes: true`). Card может, только после раскрытия source-breakdown, запросить те же read-only данные максимум для 16 дополнительных **явно перечисленных** source IDs |
| Представление | Panel сохраняет четыре weekly tabs: Electricity, Water, Fuel и Power. Card по умолчанию показывает те же согласованные utilities и может строить по ним Recorder weekly statistics при явной настройке; администратор также может задать точные `sensor_groups` и закрытую source-breakdown по подтверждённым meter/feeder IDs. Полный raw catalogue включается только отдельным `show_catalog: true` и только для HA administrator. В обоих случаях источник, entity ID, текущее значение, unit и `Unavailable` / `No record` не подменяются догадкой |
| Финансовые состояния | Только индивидуальные monetary/cost состояния, уже опубликованные Home Assistant; без вычисляемой суммы, тарифа или прогноза от Oriel |
| История | Для weekly timeline — только ограниченный запрос Recorder primary-сущности; для раскрытой source-breakdown — не более 16 дополнительно явно configured sources. Bulk import/export Recorder запрещён. История и live-state не смешиваются без явной маркировки |
| Доступ | Авторизованные пользователи Home Assistant в пределах их собственной HA-сессии; на строгом пилоте - администратор Home Assistant или конкретно письменно утверждённые named users |
| Обновление | Замена одного JS-файла с versioned URL, проверкой YAML, Home Assistant backup и возможностью отката |
| Поддержка | Диагностика отображения и data-quality для согласованных сущностей; только по утверждённому временному доступу |
| Доставка кода | Публичный GitHub допускается только как HTTPS-источник проверенных JS assets и инструкции. Он не получает HA database, configuration, backups, logs, secrets, token или live telemetry |

### 3.2 Явно не включено

Следующее запрещено и не может быть добавлено «по ходу дела» устной просьбой:

- любые вызовы `hass.callService`, REST `POST`, WebSocket-команды **кроме явно разрешённого read-only** `history/history_during_period` из раздела 3.1, или иное управление устройством;
- изменение автоматизаций, сценариев, dashboard, helper-сущностей, интеграций, конфигурации, прошивок или сетевых настроек Home Assistant;
- управление замками, воротами, гаражом, шлагбаумом, отоплением, электропитанием, генератором, насосами, UPS, батареями, EV, освещением, шторами либо AV;
- камеры, видеопотоки, snapshots, аудио, NVR recordings, тревожные события, alarm codes, face recognition и visitor logs;
- IP-адреса, MAC-адреса, Wi-Fi credentials, VPN/Tailscale keys, topology сети, пароли, токены, секреты или резервные копии Home Assistant;
- доступ третьих лиц к самому Home Assistant по публичной ссылке, iframe внешнего сайта, W3DS login, external analytics, пиксели, рекламу или сторонний JavaScript во время работы panel/card; публичная HTTPS-ссылка **только на проверенный статический JS asset и инструкцию** разрешена по разделу 9;
- сервис охраны, пожарная безопасность, CCTV monitoring, keyholding, remote guarding, emergency response, SIA-licensed activity либо обещание реакции 24/7;
- бухгалтерия, invoice approval, платежи, service charge, tenant management, compliance certification, EPC, страховые скидки или юридически значимые отчёты;
- экспорт полных Recorder records, device/entity registries, event logs или конфигурации Home Assistant в Oriel cloud, Git, чат, email либо investor portal.

## 4. Allowlist и полный admin inventory

### 4.1 Общий принцип

По умолчанию и panel, и card используют строгий allowlist. Исключение для
**локального admin-only Aldworth pilot** — явно включённый
`show_catalog: true`: каталог показывает все `sensor.*`, уже
переданные Home Assistant в `hass.states` текущему авторизованному
admin-пользователю. Это не REST API discovery, не чтение registry и не экспорт
данных. Оно не доступно investor, guest, tenant, contractor или public user.

Полная inventory mode требует owner approval и документированной проверки
аудитории. Для любого пользователя без HA administrator role используются
только точные `entity_ids` в YAML-конфигурации.

### 4.2 Разрешённые классы источников Aldworth

| Система | Допустимые Home Assistant entity IDs / правила | Что можно показать | Чего показывать нельзя |
|---|---|---|---|
| Electricity | `sensor.total_power`, `sensor.total_l1_power`, `sensor.total_l2_power`, `sensor.total_l3_power`, согласованные `sensor.shellypro3em_*_(power\|energy\|energy_cost)` | Мгновенная мощность, энергия, отдельные опубликованные cost states, unit и freshness | Сумма фаз/линий без подтверждённой electrical topology; новый tariff; invoice amount; savings claim |
| Water | `sensor.house_water_1_(flow\|total_l)`, `sensor.main_water_(flow\|total_l)`, `sensor.lodge_water_(flow\|total_l\|tank_volume)` | Flow, cumulative total, tank volume, unit, доступность | Совокупный расход estate без подтверждённой plumbing topology; occupant inference; leak decision без отдельного правила и человека |
| Fuel | `sensor.house_fuel_tank_*` и согласованные `_volume` | Уровень/объём топлива и unit | Заказ топлива, расчёт остатка в деньгах, автоматический refill, прогноз даты исчерпания |
| Power | Согласованные UPS/battery states с location `office`, `lodge`, `basement` или `loft` | Заряд, режим, доступное состояние, если опубликовано источником | Команда UPS, отключение/переключение нагрузки, гарантия электропитания |

### 4.3 Запрет на скрытое расширение данных

- Новое поле интерфейса не является разрешением на новый источник.
- Похожее имя сущности не является разрешением на её использование.
- Наличие данных в Recorder не является разрешением на их экспорт или показ.
- Сущность, содержащая имя человека, комнаты, гостя, сотрудника, двери, камеры, кода, ключа или устройства доступа, по умолчанию запрещена.
- При сомнении источник классифицируется как запрещённый до письменного approval.

## 5. Правила достоверности чисел

### 5.1 Live data

Каждая live-карточка должна показать либо:

- значение, опубликованное согласованным Home Assistant entity;
- его unit, если он есть у источника;
- время наблюдения/обновления, если оно доступно;
- `Unavailable` / `Unknown`, если состояние не поступает.

Oriel не заменяет недостающие данные нулём, средним, последним «правдоподобным» значением или ручной догадкой.

### 5.2 История

Panel: исторический экран weekly timeline получает не более шести недель через один
внутренний подписанный запрос Home Assistant Recorder для **одной выбранной
allowlisted-сущности**. Никаких bulk import/export, запросов списка сущностей,
атрибутов или истории других источников панель не делает.

Card: live source cards читают `hass.states`. Если в card YAML внесены
`archive_weekly_values` или `archive_weekly_costs`, это должны быть только
предварительно проверенные curator/import values с указанным source и периодом;
они не являются live telemetry и не должны обновляться автоматически без нового
owner-approved data flow.

Card source-breakdown разрешён только как закрытый по умолчанию, явный список
`source_breakdowns.<system>.sources` (максимум 16 `sensor.*` IDs). Пока список
закрыт, дополнительных Recorder-запросов нет. После открытия и только при
`statistics: true` card может запросить недельную историю этих **точно
перечисленных** IDs через ту же авторизованную HA WebSocket-сессию. Нельзя
искать source по regex, названию комнаты или всему `hass.states`, запрашивать
registries, атрибуты либо выгружать историю.

- Для cumulative meters недельное значение — разница первого и последнего
фактического значения в периоде. Для level/status источников используется
последнее фактическое состояние периода. Отсутствующий период остаётся
`No record`.
- Принимаются только фактически записанные local days/periods; неполный
интервал всегда помечается количеством recorded days.
- Каждый statistic ID остаётся отдельным источником; Oriel не создаёт «общий estate total» без подтверждённой схемы электричества/воды.
- `relation: independent` никогда не суммируется с total. `relation: part_of_total`
  может показать процент только если все компоненты за выбранную неделю имеют
  ту же coverage и численно сходятся с approved parent meter в допустимой
  погрешности округления. Иначе строка остаётся без percentage, а не получает
  догадку.
- Для Aldworth допустимые названия feeder/источника должны быть взяты из
  утверждённой HA-конфигурации или отдельного topology approval. Название
  устройства не превращает его автоматически в formal HA Area или физически
  подтверждённое помещение.
- Для cumulative meters используются правила, устойчивые к meter reset/correction; подозрительные интервалы помечаются или исключаются, а не сглаживаются.
- Live reading всегда подписывается как `Live now`; исторический график всегда подписывается как `Recorded history`.
- Нельзя представлять live-state как исторический факт, и нельзя выдавать историческое среднее за текущее состояние.

### 5.3 Деньги и стоимость

| Метка | Разрешение |
|---|---|
| `Recorded cost` | Только если Home Assistant уже публикует конкретное cost state и его источник известен |
| `Tariff estimate` | Только после отдельного утверждённого tariff model; всегда явно маркируется estimate |
| `Invoice actual` | Только из согласованного invoice record; не выводится из kWh автоматически |
| `Forecast` | Не входит в Aldworth v1 |
| `Savings` | Не входит в Aldworth v1; запрещены claims без baseline, методологии и owner approval |

## 6. Пользователи, роли и доступ

| Роль | Разрешения | Запреты |
|---|---|---|
| Владелец Home Assistant | Создаёт и отзывает пользователей, решает состав allowlist, хранит master admin credentials | Не передаёт shared admin credentials Oriel или подрядчику |
| Aldworth HA administrator | Устанавливает/откатывает panel asset, меняет YAML после backup и проверки конфигурации | Не раскрывает секреты в Git, чатах или browser storage |
| Estate / house manager | Только просмотр согласованной Oriel card или panel, если владелец выдал отдельного HA user | Не видит настройки HA, secrets, камеры, locks, raw events; не получает `inventory_mode: all_sensors`; не меняет asset или dashboard config |
| Integrator | Временный scoped technical access только на утверждённые часы/задачу | Не получает owner password, unrestricted admin, публичный VPN или право менять scope самостоятельно |
| Oriel support | Только owner-approved time-bound support, предпочтительно совместная сессия | Не получает permanent admin, Long-Lived Token, recorder backup или remote-control rights |
| Investor / guest / public user | **Нет доступа к Aldworth HA panel v1** | Никаких live links, external Oriel login, iframe, dashboard share или raw telemetry |

На строгом первом пилоте `require_admin: true`. Переход к `false` возможен только после отдельного access review: список HA users, data classification, logging, owner approval и проверка, что panel всё ещё read-only.

## 7. Безопасность и секреты

1. Master Home Assistant admin account принадлежит владельцу, не Oriel.
2. Нет shared account и нет общего пароля для администратора, подрядчика и поддержки.
3. MFA включается для удалённого admin access там, где Home Assistant/identity provider это поддерживает.
4. Home Assistant не публикуется напрямую в открытый интернет ради Oriel. Remote support допускается только через owner-approved VPN/Tailscale или совместную сессию.
5. `oriel-panel.js` и `oriel-card.js` не содержат token, secret, endpoint, tracking ID или внешний API call.
6. Panel может использовать только уже авторизованную HA WebSocket-сессию и только `history/history_during_period` для одного выбранного allowlisted entity ID. Card читает `hass.states`, configured static weekly values и, при включённом `statistics: true`, primary source и не более 16 source-breakdown IDs только после открытия dropdown. Оба интерфейса не имеют service-call capability.
7. Публичный GitHub repository содержит только reviewed source code и documentation. Запрещено публиковать туда configuration.yaml, Recorder database, backups, screenshots с персональными данными, network details, entity exports, токены или credentials.
8. Long-Lived Access Token, если когда-либо используется для bridge, хранится только в owner-controlled Keychain/secret manager; никогда не попадает в repository, pastebin, ticket, чат, URL или browser local storage.
9. Перед обновлением panel/card создаётся Home Assistant backup; предыдущий рабочий JS asset сохраняется до успешной acceptance check.
9. При подозрении на компрометацию: отключить panel/bridge, отозвать соответствующий token/user session, проверить HA audit/logs, восстановить известную рабочую версию и уведомить владельца.

## 8. Разделение panel/card и внешней отчётности

В Aldworth v1 нативные Home Assistant panel/card и внешний investor/owner reporting - разные продукты с разными границами.

| Внутри Home Assistant (panel/card) | Внешний отчёт, если он будет отдельно одобрен |
|---|---|
| Current states и ограниченная history выбранного allowlist source | Только curated aggregates / approved financial and operational metrics |
| Доступ только HA user | Отдельная identity/access policy и срок действия ссылки |
| Нет network call из панели | Отдельное DPIA/data-flow/retention решение до запуска |
| Не показывает видео/locks/access | Никогда не получает raw video, audio, lock, access, occupancy или network data |
| Нет public sharing | Revoke, expiry и access log обязательны |

Никакой внешний investor link не может быть добавлен в iframe, sidebar, native panel или card. До отдельного письменного решения внешний live sync не является частью Aldworth v1.

## 9. Технические правила установки и изменений

### 9.1 Установка и публичная доставка asset

- Official source links и pinned commit публикуются в `home-assistant/ADMINISTRATOR-GUIDE.md`; разрешённый download source — публичный GitHub repo владельца проекта по HTTPS.
- Assets размещаются только в `/config/www/oriel/oriel-panel.js` и/или `/config/www/oriel/oriel-card.js`.
- Panel configuration добавляет один `panel_custom` entry; второй `panel_custom:` key запрещён. Card подключается как Lovelace **JavaScript module Resource** и добавляется как `type: custom:oriel-card` в выбранный dashboard.
- Перед restart/config change: backup -> YAML Check configuration (если меняется YAML) -> restart (если требуется) -> browser refresh -> acceptance check.
- Разрешено добавить/изменить только согласованный dedicated Oriel dashboard/card. Изменение существующих dashboards, automations, integrations или device configuration не входит в установку.

### 9.2 Change Request обязателен для

- добавления/удаления любого entity ID;
- включения `show_catalog: true`, `statistics: true`, добавления/изменения `sensor_groups` или `source_breakdowns`, изменения списка пользователей dashboard или снятия admin-only защиты;
- изменения data classification или аудитории;
- изменения от read-only к control;
- любой интеграции с облаком, W3DS, внешним сайтом, analytics, bridge или API;
- показа новой категории данных, cost calculation или исторической агрегации;
- изменения роли, `require_admin` или remote-access method;
- публикации или смены external download source;
- обновления JS, которое меняет network behavior, entity matching, data persistence или capability panel/card.

Каждый Change Request должен содержать: причину, exact entities, owner, data classification, риски, rollback, acceptance criteria, дату approval и ответственного исполнителя.

## 10. Acceptance criteria

Пилот считается принятым только если одновременно выполнены все пункты:

- Oriel panel открывается из sidebar, если он установлен; Oriel card открывается
  в согласованном dashboard, если она установлена. Ни один интерфейс не
  показывает внешний login screen.
- В Network tab браузера нет runtime-запросов panel/card во внешние домены.
  Предварительное скачивание проверенного JS asset с указанной HTTPS GitHub
  ссылки допускается только во время controlled installation/update.
- В исходниках `oriel-panel.js` и `oriel-card.js` нет token, URL внешнего API
  или вызова service.
- В panel/card есть четыре weekly-раздела: Electricity, Water, Fuel и Power;
  при admin-only `inventory_mode: all_sensors` на том же экране доступен
  закрытый каталог всех `sensor.*` с исходными entity IDs и без придуманных значений.
- Electricity показывает то же текущее `sensor.total_power`, что и Home Assistant, когда entity доступна.
- Water показывает только разрешённые house/main/lodge states.
- Existing Shelly cost states отображаются индивидуально; суммарная стоимость не изобретается.
- Panel weekly timeline и Card при явно включённом `statistics: true` посылают `history/history_during_period` только к allowlisted entity, не более чем за шесть недель и без attributes. Card не делает source-breakdown запросов, пока dropdown закрыт; после открытия может обратиться не более чем к 16 дополнительно явно configured IDs. Imported weekly values всегда маркируются как recorded/imported, а не live.
- Недоступный источник отображается как `Unavailable` или отсутствует по правилам интерфейса; не заменяется нулём.
- Нажатие на любой элемент интерфейса не вызывает изменения state устройства.
- После обновления доступен rollback на предыдущий asset и результат повторно проходит эти проверки.
- Владелец письменно подтверждает список entity IDs, user roles и дату acceptance.

## 11. Операционная ответственность

| Область | Ответственный | Граница ответственности |
|---|---|---|
| Корректность физического сенсора, проводки, счётчика и контроллера | Владелец / назначенный integrator | Oriel отображает опубликованное состояние, но не сертифицирует физическое оборудование |
| Home Assistant OS, сеть, backup и users | Владелец / HA administrator | Oriel не владеет платформой и не гарантирует её uptime |
| Oriel panel/card rendering, документированный allowlist и public asset handoff | Oriel / назначенный maintainer | Только в пределах утверждённой версии, публичных reviewed assets и источников |
| Реакция на alarm, leak, fire, intrusion или outage | Владелец / назначенный specialist contractor | Oriel не является monitoring/response service |
| Решение о расходе, ремонте или подрядчике | Владелец / estate manager | Oriel может показать evidence; не утверждает и не оплачивает работы |

## 12. События, которые требуют остановки пилота

Работа приостанавливается до решения владельца, если:

- кто-либо просит добавить camera, audio, lock, alarm, access, person/occupancy или network-identifying data;
- найден token/secret в repository, issue, чатах, URL или фронтенд-коде;
- panel или card совершает внешний runtime network call или service call;
- значения не имеют подтверждённого источника, topology неясна или данные конфликтуют;
- предлагается автоматическое действие на основе Oriel;
- требуется публичная ссылка или доступ инвестора к Home Assistant; публикация только статического reviewed JS/doc asset допускается по разделу 9;
- меняется владелец объекта, HA admin, integrator или правовая основа доступа к данным;
- обнаружен security incident, несанкционированный доступ или утечка.

Возобновление возможно только после письменного risk review, фиксированного remediation plan и новой acceptance check.

## 13. Критерий выхода из пилота

Пилот может перейти в следующий этап только после минимум 30 дней стабильной работы и когда:

1. Все разрешённые источники имеют подписанного владельца и известную data quality.
2. Owner/estate manager реально использует panel или card для еженедельного статуса, а не только демонстрации.
3. Нет несанкционированных external calls, controls или scope expansion.
4. Есть backup/restore и update/rollback evidence.
5. Согласован отдельный письменный scope для следующего этапа: asset passport, curated external report, maintenance workflow или более широкий набор источников.

До этого момента Aldworth остаётся **одним закрытым, read-only, owner-controlled pilot**, а не шаблоном для автоматического развёртывания у новых клиентов.
