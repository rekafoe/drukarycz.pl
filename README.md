# drukarycz.pl

Отдельный сайт сувенирки: футболки и кружки со своим макетом. Редактор на сайте. Черновик макета пишет сервер сайта в CRM (`editorDraftToken`); если CRM молчит — локальный токен. Заказ, цена и оплата в CRM пока не уходят.

## Как открыть

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 43131
```

Сайт: http://127.0.0.1:43131

Интерфейс по-польски, цены-заглушки в zł. Путь: две двери → лавка выбранной вещи (`/koszulka`, `/kubek`) → лист (`/koszulka/maket`, `/kubek/maket`) → корзина. Цвет с лавки красит ткань 3D, принт лежит поверх. В редакторе холст Fabric и 3D футболки и кружки. На листе кнопки действий нарисованы своими иконками в коде страницы, без шрифта иконок и без запроса к чужому серверу. Перед корзиной лист говорит, если фото реже 300 dpi, объект вылез за край или текст меньше 5 мм. Белый цвет надписи остаётся на модели. PNG зоны на 300 dpi пишется в `data/prints` на сервере drukarycz.pl, когда человек идёт из редактора в корзину. Редактор открывается целиком, когда лист и модель уже собраны. До этого на экране только «Otwieramy edytor…». Файл футболки сжат с 6,5 МБ до 300 КБ, а модели и код редактора начинают грузиться уже на дверях. Подпись по-польски всплывает при наведении. Названия сторон — Przód, Tył, Obwód — остаются словами. Двери, лавка, холст и корзина лежат на сервере drukarycz.pl: обновление страницы их не стирает. Войти можно по польскому телефону и тестовому коду, он виден в окне входа. Заказ и цена в CRM не уходят. На лавке сувениров отделки нет: только размер (у футболки), цвет и тираж. Тираж — любая целая число ≥ 1, плюс/минус по одной штуке; 1, 5, 10 и 20 штук остаются необязательными ярлыками. Цена на лавке и в корзине идёт как «od 5 zł × N», плата за wzór — один раз на позицию.

Двери и лавка оформлены плакатом (вариант A) с акцентом кобальт `#2F5BFF`. Двери ведут на `/koszulka` и `/kubek`: это лавка вещи со своим адресом, сервер отдаёт её готовым HTML с ценой, видимым описанием и разметкой Product. «Zrób własny» и «Zmień w edytorze» открывают лист `/koszulka/maket` или `/kubek/maket`. Лавка холст не монтирует и не стирает работу, если на неё просто зайти. Назад с листа — на лавку этой вещи или на карточку wzoru. Рядом с лавками — посадочные под запросы: `/nadruk-warszawa` (druk w Warszawie), `/koszulka/rozmiary` (S–XL) i `/materialy` (kolory z oferty). Canonical, sitemap i OG wskazują `https://www.drukarycz.pl`. Главная, лавки, посадочные и правовые страницы видны поисковику без JS. Лист, `/m/*` и `/api/*` закрыты от индекса заголовком `X-Robots-Tag`, `/api/` ещё и в `robots.txt`. Корзина и вход своих адресов не имеют. Есть `robots.txt`, `sitemap.xml`, canonical, OG-картинки и польская страница 404. Картинки OG рисуются только латиницей, без запроса к Google Fonts.

В `next dev` для сравнения остаются `/?v=b` — сетка и `/?v=c` — керамика, а цвет кнопок плаката — `?accent=` (`kobalt` по умолчанию, ещё `koral`, `czerwien`, `limonka`, `zielen`, `czern`). В production-сборке этих переключателей нет: сайт всегда плакат с кобальтом. Палитры лежат в `components/variants/accents.ts`. Шрифты (Unbounded, Manrope, Fraunces, IBM Plex Mono, лицензии OFL рядом) лежат в `public/fonts` и подключаются через `@font-face` с этого сайта, без CDN. Снимки вещей — в `public/products`. Снимки сняты с тех же 3D-моделей, что в редакторе; надписи на них примерные.

Поисковики на продакшене задаются переменными окружения, пустые не выводятся:

```bash
SITE_URL=https://www.drukarycz.pl      # домен в canonical, sitemap и OG
GOOGLE_SITE_VERIFICATION=              # код из Google Search Console, мета google-site-verification
BING_SITE_VERIFICATION=                # код из Bing Webmaster Tools, мета msvalidate.01
INDEXNOW_KEY=                          # ключ IndexNow, отдаётся по /indexnow.txt
```

Сайт сам в IndexNow не стучится. После выкладки адреса отправляет владелец:

```bash
curl "https://api.indexnow.org/indexnow?url=https://drukarycz.pl/&key=$INDEXNOW_KEY&keyLocation=https://drukarycz.pl/indexnow.txt"
```

## Gotowe wzory

Витрина готовых дизайнов на тестовых данных: полоса «Gotowe wzory» в лавке под «Zrób własny», страница `/wzory` с рубриками и карточка `/wzory/000123`. На карточке два пути. «Zamów bez zmian» возвращает в лавку с выбранным wzorem и ведёт в корзину. «Zmień w edytorze» открывает тот же шаблон в редакторе. В корзине у позиции есть `designTemplateId`, `designTemplateCode`, `designUsageFee`, `designModified` и `usedPrintAreaIds`. Цена wzoru в zł, один раз на позицию, при нуле подпись «Wzór w cenie».

Источник выбирает `DESIGNS_SOURCE`. По умолчанию `fixtures`: ответы в форме CRM лежат в `fixtures/wzory`. `DESIGNS_SOURCE=crm` читает публичные шаблоны с CRM, если задан `CRM_URL`; если CRM молчит — снова fixtures, сайт без секретов открывается. Ручки сайта: `GET /api/wzory?produkt=koszulka|kubek`, `GET /api/wzory/kategorie`, `GET /api/wzory/{id}`, `POST /api/wzory/{id}/wybierz`, `POST /api/wzory/wlasny`. Картинки и шрифты CRM только через `GET /media/crm/*`. Шаблон проверяется до показа: зоны в мм с допуском 1 мм, единицы холста, адреса картинок и шрифтов только со своего сервера. Плохой шаблон в витрину не попадает, а по прямой ссылке показывает «Ten wzór nie pasuje do tego produktu.». Цену и номер wzoru в проект пишет только сервер. Браузер в CRM не ходит.

Черновик редактора: `POST /api/editor/drafts` и `GET /api/editor/drafts/{token}` на этом сайте проксируют CRM `POST/GET /api/public-editor/drafts`. В позицию корзины пишется `editorDraftToken`. Гость собирает макет; заказ по-прежнему только после входа. Если нет `CRM_URL` или `WEBSITE_ORDER_API_KEY`, или CRM не отвечает, токен локальный (`mock_…` в `data/editor-drafts.json`). Заказ, оплата и SMS в CRM не уходят.

```bash
DESIGNS_SOURCE=crm                 # иначе fixtures
CRM_URL=                           # origin CRM, например https://crm.example.com (хвост /api необязателен; синоним CRM_API_URL)
WEBSITE_ORDER_API_KEY=             # X-API-Key для /api/public-editor/* ; в браузер не попадает
# не секреты, связь двери с товаром CRM (иначе fixtures/wzory/produkty.json):
CRM_KOSZULKA_PRODUCT_ID=
CRM_KOSZULKA_TYPE_ID=
CRM_KOSZULKA_BLANK_TEMPLATE_ID=
CRM_KUBEK_PRODUCT_ID=
CRM_KUBEK_TYPE_ID=
CRM_KUBEK_BLANK_TEMPLATE_ID=
```

```bash
npm run wzory:fixtures   # пересобрать fixtures/wzory и превью
npm run wzory:previews   # только превью public/wzory/preview/*.png
npm test
```

Шрифты Archivo Black и Caveat лежат в `public/fonts/wzory` под OFL.

## Право

Страницы regulamin, prywatność, cookies, odstąpienie, reklamacje, dostawa и kontakt лежат в `/prawne`. Корзина просит e-mail, адрес и две отдельные галочки, оплату не берёт. Реквизиты фирмы в `lib/seller.ts` пустые, пока организация их не впишет. Что осталось до продажи — в `docs/plan-prawny.md`.
