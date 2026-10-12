# Oriel card для Home Assistant — инструкция администратору

## Что устанавливается

`oriel-card.js` — это **read-only Lovelace custom card**. Она отображается на
обычном Home Assistant dashboard, а не создаёт новую интеграцию, пользователя,
API token или путь управления устройствами.

Карточка читает только состояния, уже переданные Home Assistant в браузер
авторизованного пользователя (`hass.states`). Она не вызывает services,
не делает внешних запросов и не связана технически с отдельной Oriel panel.
Панель и карточку можно использовать вместе или по отдельности.

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
   /local/oriel/oriel-card.js?v=1
   ```

5. Выберите **JavaScript module**.
6. Нажмите **Create**.
7. Обновите страницу браузера.

При обновлении файла меняйте версию в URL, например на `?v=2`. Это снимает
старую версию из browser cache.

### 3. Добавить карточку на dashboard

1. Откройте нужный dashboard.
2. Нажмите `⋮ → Edit dashboard → Add card`.
3. Выберите **Manual**.
4. Вставьте YAML ниже и нажмите **Save**.

## Рекомендуемая конфигурация Aldworth

```yaml
type: custom:oriel-card

# Включать только на admin-only dashboard: покажет каждый sensor.*,
# доступный текущему Home Assistant user.
inventory_mode: all_sensors

# В weekly-части карточки используем только подтверждённые источники.
entity_ids:
  electricity:
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.house_water_1_total_l
  fuel: []
  power: []

# Эти значения нужны только для локальной демонстрации импортированного
# Aldworth archive; не добавляйте их для live-only production dashboard.
archive_weekly_values:
  electricity: [244.7, 834.1, 476.2, 485.4, 486.5, 367.0]
  water: [148, 1690, 501, 1116, 1331, 877]
archive_weekly_costs:
  electricity: [93.77, 320.29, 182.84, 186.39, 186.81, 140.91]
archive_anchor: "2026-09-19T12:00:00.000Z"
archive_timezone: Europe/London
```

`archive_anchor` и `archive_timezone` фиксируют британские календарные недели:
каждая строка идёт с понедельника по воскресенье, например `14–20 Sept 2026`.

## Безопасный вариант для ограниченной аудитории

**Не** добавляйте `inventory_mode: all_sensors` на dashboard инвестора,
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
вместо отсутствующего состояния ноль или оценку.

## Проверка после установки

- В карточке есть вкладки Electricity, Water, Fuel, Power.
- Значения совпадают с соответствующими entity в **Developer tools → States**.
- `Unavailable` остаётся `Unavailable`; не появляется выдуманное число.
- Нажатие на карточку не меняет состояние устройства.
- В browser Network нет внешних запросов от `oriel-card.js`.

## Обновление и откат

**Обновление:** замените `/config/www/oriel/oriel-card.js`, увеличьте
параметр версии в resource URL (`?v=2`) и обновите браузер.

**Откат:** верните предыдущий JS-файл из Home Assistant backup или из
проверенной версии, поменяйте URL на предыдущую версию и обновите браузер.
Чтобы полностью убрать карточку, удалите её через **Edit dashboard**; затем,
если она больше нигде не применяется, удалите resource в
**Settings → Dashboards → Resources**.
