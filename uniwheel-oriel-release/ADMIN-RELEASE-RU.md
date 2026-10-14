# Oriel на UniWheel — инструкция релиза для администратора

**Версия:** `1.0.0`  
**Дата пакета:** 14 октября 2026  
**Целевой URL:** `https://www.uniwheel.co.uk/oriel/`  
**Тип:** полностью статическая страница HTML/CSS/JS. Сборка, Node.js, база данных, API-ключи и Home Assistant для неё не нужны.

> Важно: это публичная маркетинговая страница Oriel. Это **не** Home Assistant-карточка и не способ открыть HA в интернете. Никакие живые данные Aldworth, entity ID, токены, скриншоты с показаниями или URL Home Assistant в неё не загружаются.

## 1. Что лежит в пакете

```text
uniwheel-oriel-release/
├── README.md
├── ADMIN-RELEASE-RU.md
└── oriel/
    ├── index.html
    └── assets/
        ├── oriel.css
        ├── oriel.js
        └── oriel-mark.svg
```

Все четыре файла из `oriel/` обязательны. В `index.html` используются относительные адреса `assets/...`, поэтому нельзя положить CSS/JS рядом с корнем сайта или загрузить только HTML.

## 2. Что делает страница

- объясняет Oriel как read-only, Home Assistant-native интерфейс для estate operations;
- показывает безопасную интерактивную демонстрацию карточки: вкладки Electricity / Water / Fuel / Power, UK-недели Mon–Sun и список согласованных источников;
- подчёркивает allowlist, исторические данные из Recorder и правило «деньги только из подтверждённых cumulative tariff counters»;
- открывает `mailto:sales@uniwheel.co.uk` для запроса пилота и существующую страницу UniWheel Contact.

Демо **намеренно не выводит числовые показатели**. Оно не запрашивает и не содержит данных реального объекта.

## 3. Предрелизная проверка

1. Проверьте SHA-256 по файлу [CHECKSUMS.txt](CHECKSUMS.txt) из того же пакета.
2. Распакуйте пакет локально и убедитесь, что структура `oriel/index.html` и `oriel/assets/` сохранилась.
3. При желании проверьте без внешнего доступа:

   ```bash
   cd /path/to/uniwheel-oriel-release
   python3 -m http.server 8080
   ```

   Затем откройте `http://127.0.0.1:8080/oriel/`. Остановите тестовый сервер после проверки (`Ctrl+C`).

4. Не добавляйте в `index.html`, `oriel.js` или CMS-поля:

   - URL Home Assistant;
   - long-lived access token;
   - IP / Tailnet address;
   - реальные значения, выгрузки, скриншоты или названия сенсоров дома;
   - конфигурацию Oriel card с entity ID.

## 4. Публикация

### Вариант A — файловый хостинг / SFTP / cPanel (рекомендуется)

1. Найдите web root домена `www.uniwheel.co.uk` (например, `public_html`, `htdocs` или иной путь, который подтверждён вашим хостингом).
2. Если на сервере уже есть папка `oriel`, не удаляйте её сразу. Переименуйте её в резервную копию с датой, например `oriel.backup-2026-10-14`.
3. Загрузите всю локальную папку `oriel/` в web root. После загрузки должно получиться:

   ```text
   <web-root>/oriel/index.html
   <web-root>/oriel/assets/oriel.css
   <web-root>/oriel/assets/oriel.js
   <web-root>/oriel/assets/oriel-mark.svg
   ```

4. Откройте в приватном окне браузера: `https://www.uniwheel.co.uk/oriel/`.
5. Если сервер не выдаёт `index.html` для directory URL, попросите его обслуживать directory index либо временно используйте `https://www.uniwheel.co.uk/oriel/index.html`. В этом случае до индексации исправьте `canonical` в `index.html` на фактический публичный URL.

### Вариант B — CMS с файловым менеджером

Создайте в корне сайта каталог `oriel`, затем перенесите в него `index.html` и подпапку `assets` без изменения структуры. Не вставляйте страницу через WYSIWYG-редактор: редактор может удалить `script`, классы, мета-теги или переписать относительные пути.

### Не делать

- Не заменять `/index.html`, `/catalogue.html`, `/about.html` или `/contact.html`.
- Не ставить эту страницу в iframe поверх Home Assistant.
- Не добавлять реальную HA-карточку на публичный UniWheel сайт.
- Не подключать сторонние счётчики, пиксели или формы без отдельного решения владельца данных и проверки privacy/compliance.

## 5. Опционально: ссылка в меню UniWheel

После успешной проверки добавьте в общий header существующих UniWheel-страниц одну ссылку между `About` и `Contact`:

```html
<a href="/oriel/">Oriel</a>
```

Это единственное изменение в существующих страницах, которое требуется для навигации. Сначала публикация `/oriel/`, затем ссылка. Если у сайта нет общего header-файла, обновите нужные статические страницы по отдельности и проверьте каждую.

## 6. Кэш и заголовки

В пакете имена файлов не хешированы, чтобы будущий релиз было легко обновить. Поэтому не задавайте `immutable` или cache на год.

Безопасный ориентир:

| Путь | Рекомендуемый Cache-Control |
| --- | --- |
| `/oriel/`, `/oriel/index.html` | `no-cache` или `max-age=300` |
| `/oriel/assets/oriel.css`, `/oriel/assets/oriel.js`, `/oriel/assets/oriel-mark.svg` | `max-age=3600` |

Если на сервере уже действует общий CSP, сначала проверьте страницу с ним. У релиза нет внешних шрифтов, аналитики, изображений или API-запросов; совместимая строгая политика может быть такой:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'
```

Не внедряйте новый CSP глобально для домена без проверки других страниц магазина.

## 7. Acceptance checklist

Проверьте после загрузки в приватном окне и, если используется CDN, после purge именно `/oriel/*`:

- [ ] `https://www.uniwheel.co.uk/oriel/` возвращает 200 и не редиректит на страницу магазина.
- [ ] В DevTools → Network нет 404 для `oriel.css`, `oriel.js`, `oriel-mark.svg`.
- [ ] Открываются и меняются все 4 вкладки demo: Electricity, Water, Fuel, Power.
- [ ] По строкам недель можно кликнуть: выбранная строка подсвечивается, текст детализации меняется.
- [ ] Раскрывается `Approved sources`.
- [ ] На телефоне открывается/закрывается меню и нет горизонтального скролла страницы.
- [ ] `Discuss a pilot` корректно открывает email-клиент с адресом UniWheel; `Contact details` ведёт на существующую contact page.
- [ ] В коде и в HTML-исходнике нет Home Assistant URL, токена, реальной telemetry, entity ID или снимка частного объекта.
- [ ] Установленная страница не создаёт cookies, не делает API-запросы и не требует логина.
- [ ] Если добавлена ссылка в header, она есть на всех согласованных статических страницах и не ломает mobile navigation.

## 8. Rollback

Поскольку релиз изолирован в одной папке, rollback не затрагивает магазин:

1. Удалите добавленную ссылку `Oriel` из header, если она была добавлена.
2. Переименуйте текущую папку `/oriel/` в `/oriel.failed-YYYY-MM-DD/` или восстановите сохранённую `/oriel.backup-YYYY-MM-DD/`.
3. Очистите CDN-кэш только для `/oriel/*`.
4. Проверьте, что homepage, catalogue и contact page UniWheel работают как до релиза.

## 9. Разделение ответственности

| Что | Где живёт | Кому доступно |
| --- | --- | --- |
| Oriel marketing page | `www.uniwheel.co.uk/oriel/` | всем посетителям; без данных объекта |
| Oriel Home Assistant card | внутри конкретного HA Lovelace dashboard | только авторизованным пользователям HA |
| HA entity mapping / Recorder history / tariff counters | конфигурация и база конкретного HA | только администратору/допущенным HA-пользователям |
| HA credentials, tokens, remote address | secret store администратора | никогда не в веб-пакете и не в GitHub issue/странице |

Если после релиза потребуется реальная форма, аналитика, CRM или личный кабинет, это отдельный этап: согласовать владельца данных, обработку персональных данных, endpoint, anti-spam и политику privacy до добавления к этой статичной странице.
