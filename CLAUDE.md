# CLAUDE.md — directus-viewport

Rozszerzenie layoutu dla Directus. Zastępuje standardowy widok listy tabelą z możliwością
edycji komórek inline (podwójne kliknięcie), auto-zapisem i szufladą szczegółów.

## Repo

```
git@github.com:tf-ostrovski/directus-viewport.git
```

## Technologie

- **Directus Extensions SDK** (`@directus/extensions-sdk`)
- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript**
- **Build:** `directus-extension build` (oparty na Vite)

## Struktura

```
src/
├── index.ts          ← entry point: defineLayout(), setup(), stan globalny
├── layout.vue        ← główny komponent: tabela, paginacja, zarządzanie edycją
├── editable-cell.vue ← pojedyncza komórka tabeli z trybem edycji (dblclick)
├── detail-drawer.vue ← szuflada szczegółów (teleport do body, edycja przez API)
├── options.vue       ← panel opcji layoutu (spacing, auto-save, delay)
├── actions.vue       ← pasek akcji (licznik rekordów, przycisk "Save Changes")
└── types.ts          ← LayoutOptions, LayoutQuery

dist/
└── index.js          ← zbudowany bundle (montowany do Directus)
```

## Komendy

```bash
npm run build   # jednorazowy build
npm run dev     # watch mode — przebudowuje dist/ przy każdej zmianie src/
```

## Jak działa edycja

1. Użytkownik dwukrotnie klika komórkę → `editable-cell.vue` wchodzi w tryb edycji
2. Po `blur` / `Enter` → wartość trafia do `pendingEdits` (Map: `pk → {field: value}`)
3. Jeśli `autoSave=true` → timer (`autoSaveDelay` ms) → `flushEdits()` → `PATCH /items/{collection}/{pk}`
4. Jeśli `autoSave=false` → przycisk "Save Changes" w `actions.vue` → `flushEdits()`
5. Komórki z `isDirty=true` mają żółte tło (`color-mix` z `--theme--warning`)

## Deployment

Push do `main` w repo `sys` → deploy.sh klonuje ten repo na VPS, buduje `npm run build`, i montuje jako bind mount do kontenera Directus. Szczegoly w `../sys/scripts/deploy.sh`.

## Lokalne srodowisko dev

Stack Docker zyje w `../sys/` (multi-root workspace `appka.code-workspace`).

```bash
# Start stacka (z katalogu sys)
cd ../sys && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Watch mode (z tego katalogu)
npm run dev

# Directus panel
http://localhost:8055
```

Rozszerzenie jest montowane jako bind mount w `docker-compose.dev.yml`:
```yaml
../directus-viewport:/directus/extensions/directus-viewport
```
`EXTENSIONS_AUTO_RELOAD=true` — Directus wykrywa zmiany w `dist/` automatycznie (kilka sekund).

## VPS — produkcja

| | |
|---|---|
| **URL** | https://directus.ostrowski.group |
| **Kontener** | `supabase-directus` |
| **SSH** | `ssh root@147.93.59.125` (klucz SSH) |
| **Extensions na VPS** | `/opt/sys/extensions/directus-viewport/` (bind mount) |

```bash
# Sprawdz logi Directus na VPS
ssh root@147.93.59.125 "docker logs supabase-directus --tail 50"
```

## Znane ograniczenia / TODO

- Typy pól `alias`, `json`, `o2m`, `m2m`, `m2a` są readonly (brak inline edycji)
- `detail-drawer.vue` używa prostych `<input>` — brak komponentów Directus UI (v-interface)
- Wiele kolekcji nie ma primary key (`junction` tabele) — Directus je ignoruje (WARN w logach)
- Brak wirtualnego scrollowania — przy dużych kolekcjach może być wolno

## Baza danych

Directus używa schematu `airtable` (nie `public`) — `DB_SEARCH_PATH=airtable,test,extensions`.
Wszystkie tabele `directus_*` są w schemacie `airtable`.
