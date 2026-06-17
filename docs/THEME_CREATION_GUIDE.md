# Panduan Membuat Theme Baru

Dokumen ini menjelaskan langkah praktis untuk menambahkan theme baru pada proyek ini. Arsitektur detail ada di `docs/MULTI_THEME_ARCHITECTURE.md`.

## Arsitektur: Gateway = Logic Holder + Theme Registry

**Poin penting:** Gateway component adalah **LOGIC HOLDER** dan menggunakan **Theme Registry** untuk resolve komponen theme — tanpa `v-if`/`v-else-if`.

```
Gateway component (LOGIC HOLDER)
  ├── All logic: composables, refs, computed, watchers, API calls
  ├── Pre-compute display values sebagai props
  ├── v-model:xxx binding untuk state dua arah (defineModel)
  ├── @event binding untuk aksi satu arah (emit)
  ├── resolveThemeComponent() dari Theme Registry
  │
  ├── themes/default/<Component>.vue -> TEMPLATE + defineModel
  └── themes/simasko/<Component>.vue -> TEMPLATE + defineModel
```

### Aturan Penting

| Layer | Berisi | Contoh |
|-------|--------|--------|
| **Gateway** | All logic, composables, API + `<component :is>` | `resolveThemeComponent('ProductItem', theme)` |
| **Theme variant** | Template + `defineModel` + `defineProps` + `defineEmits` | Markup HTML + Tailwind classes |
| **Theme Registry** | Mapping nama komponen → nama auto-import | `app/utils/theme-registry.ts` |

### Theme Registry

Semua komponen theme didaftarkan di `app/utils/theme-registry.ts` dengan import dari `#components`:

```ts
import type { Component } from 'vue'
import {
  ThemesDefaultProductItem,
  ThemesSimaskoProductItem,
  ThemesBaruProductItem,
} from '#components'

const THEME_COMPONENT_REGISTRY: Record<string, Record<string, Component>> = {
  ProductItem: {
    default: ThemesDefaultProductItem,
    simasko: ThemesSimaskoProductItem,
    '<baru>': ThemesBaruProductItem,
  },
  // ...
}

export function resolveThemeComponent(componentName: string, theme: string): Component {
  const entry = THEME_COMPONENT_REGISTRY[componentName]
  if (!entry) throw new Error(`Theme component not found: ${componentName}`)
  return entry[theme] ?? entry.default!
}
```

Gateway menggunakannya via `useTheme()` composable **(cara baru, recommended)**:

```vue
<script setup lang="ts">
// 1 line — ganti 4 lines boilerplate resolveThemeComponent + resolveStoreTheme
const { resolvedComponent } = useTheme('ProductItem')
</script>
<template>
  <component :is="resolvedComponent" v-bind="productItemProps" />
</template>
```

### State Management Pattern

**Dua arah (v-model / defineModel):**
Untuk state yang bisa berubah dari kedua sisi (gateway dan theme variant).

Gateway:
```vue
<component :is="resolvedComponent" v-model:search-query="searchQuery" />
```

Theme variant:
```vue
<script setup lang="ts">
const searchQuery = defineModel<string>('searchQuery', { default: '' })
</script>
<template>
  <UInput v-model="searchQuery" />
</template>
```

**Satu arah (emit):**
Untuk aksi yang hanya berasal dari theme variant ke gateway.

Gateway:
```vue
@close-search="closeSearch"
```

Theme variant:
```vue
<script setup lang="ts">
const emit = defineEmits<{ closeSearch: [] }>()
const onCloseSearch = () => emit('closeSearch')
</script>
<template>
  <UButton @click="onCloseSearch" />
</template>
```

## Struktur Folder

```
app/
├── utils/
│   ├── store-theme.ts          # resolveStoreTheme() + StoreThemeName type
│   └── theme-registry.ts      # Daftar komponen per theme
│
├── composables/
│   ├── useTheme.ts             # useTheme('SlotName') — theme resolution boilerplate
│   ├── useCartBadge.ts         # useCartBadge() — cart badge count + label
│   ├── useStoreSchema.ts       # useStoreSchema() — isSimaskoEnabled, storeTheme
│   └── useProductDisplay.ts    # useProductDisplay(product) — pre-computed display values
│
└── components/
    ├── themes/
    │   ├── default/          # Template reference — copy untuk theme baru
    │   │   ├── app/          #   Header.vue, Footer.vue
    │   │   ├── product/      #   Item.vue, ItemSmall.vue, Detail.vue
    │   │   └── home/         #   BannerSection.vue, SimaskoSection.vue,
    │   │                     #   CategorySidebar.vue, ProductGrid.vue,
    │   │                     #   Layout.vue (home page layout)
    │   ├── simasko/          # Template existing — Indigo (tech-forward)
    │   ├── bazaar/           # Template existing — Rose (marketplace)
    │   ├── medical/          # Template existing — Teal (health)
    │   ├── fresh/            # Theme existing — Orange (F&B, Nunito Sans)
    │   └── luxe/             # Theme existing — Dark Charcoal + Gold (luxury)
    │
    ├── app/                  # GATEWAY (logic holder)
    ├── product/              # GATEWAY (logic holder)
    │   ├── DetailCarousel.vue  # SHARED — reusable antar theme
    │   └── DetailReview.vue    # SHARED — reusable antar theme
    ├── home/                 # GATEWAY (logic holder)
    └── setting/              # GATEWAY (logic holder)
```

## Checklist Menambah Theme Baru

### 1. Tambahkan definisi theme di config

Update `app/utils/store-theme.ts`:

```ts
export type StoreThemeName = 'default' | 'simasko' | 'bazaar' | 'medical' | 'fresh' | 'luxe' | '<theme-baru>'

export const THEME_META: Record<StoreThemeName, { label: string; category: string; icon: string }> = {
  // ... existing entries
  '<theme-baru>': { label: 'Theme Baru', category: 'general', icon: 'i-lucide-palette' },
}
```

Tambahkan CSS palette di `app/assets/css/main.css`:

```css
:root[data-store-theme='<theme-baru>'] {
  --color-primary-50: #...;
  --color-primary-500: #...;  /* Primary color */
  --color-secondary-500: #...; /* Secondary color */
  --color-accent-500: #...;    /* Accent color */
  ...
}
```

### 2. Tambahkan ke Theme Registry

Update `app/utils/theme-registry.ts` — tambah import + 1 baris per komponen:

```ts
import {
  ThemesDefaultProductItem,
  ThemesSimaskoProductItem,
  ThemesBaruProductItem,       // <-- import baru
} from '#components'

const THEME_COMPONENT_REGISTRY: Record<string, Record<string, Component>> = {
  ProductItem: {
    default: ThemesDefaultProductItem,
    simasko: ThemesSimaskoProductItem,
    '<baru>': ThemesBaruProductItem,    // <-- tambah di sini
  },
  // ... ulangi untuk setiap komponen
}
```

**Tanpa perlu edit gateway** — registry otomatis dipakai oleh semua gateway.

### 3. Buat folder theme baru

```
app/components/themes/default/  ->  app/components/themes/<theme-baru>/
```

### 4. Copy template dari default

Copy file dari `themes/default/` — **hanya template, tanpa script logic**.

| Path | Data Binding | Events |
|------|-------------|--------|
| `themes/<theme>/app/Header.vue` | `defineModel` untuk searchQuery, isSearchOpen, dll + `defineProps` | closeSearch, confirmLogout, setLocale |
| `themes/<theme>/app/BottomNav.vue` | `defineProps`: homePath, categoriesPath, cartPath, historyPath, settingPath, pcBuilderPath, isSimaskoEnabled, isAuthenticated, cartBadgeCount, pendingPaymentCount | none |
| `themes/<theme>/app/Footer.vue` | `defineProps`: storeName, storeAddress, ... | toggleColorMode |
| `themes/<theme>/app/CategoryMobileFilter.vue` | `defineProps`: items, categorySelectedItems, productFilters, totalItems, categoryItems, products, loading, loadingMore, searchQuery, themeColor | update:categorySelected, update:filterSelected, apply, reset |
| `themes/<theme>/product/Item.vue` | `defineProps`: product, hasDiscount, formattedFinalPrice, ... | none |
| `themes/<theme>/product/ItemSmall.vue` | `defineProps`: product, quantityItems, ... | delete, update-quantity, requestTracking |
| `themes/<theme>/home/BannerSection.vue` | `defineProps`: items | none |
| `themes/<theme>/home/SimaskoSection.vue` | `defineProps`: serviceCode, submitting, ... | update:serviceCode, submit, paste |
| `themes/<theme>/home/CategorySidebar.vue` | `defineProps`: items | none |
| `themes/<theme>/home/ProductGrid.vue` | `defineProps`: products, loading, loadingMore | none |
| `themes/<theme>/home/Layout.vue` | `defineProps`: banners, isSimaskoEnabled, serviceCode, submitting, pasting, pcBuilderPath, filterSelected, productFilters, categoryItems, products, loading, loadingMore | update:serviceCode, update:filterSelected, submit, paste |

### 5. Ubah hanya template + CSS class

**Yang BOLEH diubah:**
- HTML struktur layout
- Tailwind utility classes (ganti `neutral-*` dengan `info-*` dll)
- Ordering elemen
- Section dekoratif tambahan

**Yang TIDAK BOLEH diubah:**
- `defineModel` signatures (nama, tipe, default)
- `defineProps` interface (harus identik dengan default)
- `defineEmits` signatures
- Logic / computed / composables

### 5a. Variant Grouping (Detail.vue khusus)

`Detail.vue` di setiap theme menggunakan **variant grouping pattern** untuk merender opsi varian dalam section terpisah per `group` (misal: "Pilih RAM", "Pilih Warna"):

```vue
<!-- Template pattern: iterasi group sebagai section terpisah -->
<template v-for="grp in variantGroups" :key="grp.group">
  <p class="...">{{ groupLabel(grp.group) }}</p>
  <div class="flex gap-2">
    <button v-for="opt in grp.options" :key="opt.id"
      :class="selectedOptionForGroup(grp.group)?.id === opt.id ? 'ring-2' : ''"
      @click="selectVariant(opt)">
      {{ opt.label }}
    </button>
  </div>
  <!-- Sub-options di dalam group yang sama -->
  <div v-if="selectedOptionForGroup(grp.group)?.options" class="...">
    <button v-for="sub in selectedOptionForGroup(grp.group)!.options" ...>
      {{ sub.label }}
    </button>
  </div>
</template>
```

> **Important:** Props dan computed (`variantGroups`, `selectedOptionForGroup`, `groupLabel`) sudah didefinisikan di gateway. Theme shell hanya perlu mengaksesnya via `defineProps` — **jangan** duplikasi logic.

> **Group values:** `'ram'`, `'warna'`, `'ukuran'`, `'kapasitas'` — lowercase Indonesian strings.

### 6. Tambahkan font baru (jika theme pakai font berbeda)

Update `nuxt.config.ts`:

```ts
fonts: {
  families: [
    { name: 'Inter', provider: 'google' },
    { name: 'Nunito Sans', provider: 'google' },  // Untuk Fresh theme
    { name: 'EB Garamond', provider: 'google' },   // Untuk Luxe theme
    { name: '<font-baru>', provider: 'google' },   // Font theme baru
  ],
},
```

Gunakan Tailwind classes di theme shell: `font-heading`, `font-sans`, `font-mono`.

### 7. Gunakan `t()` dari `useI18n()` untuk i18n

```vue
<script setup lang="ts">
const { t } = useI18n()
</script>
<template>
  <p>{{ t('header.category') }}</p>
</template>
```

### 8. Gunakan format props untuk display values

Semua display values sudah pre-computed di gateway via `useProductDisplay()`:

```vue
<!-- BENAR — nilai sudah siap pakai -->
<p>{{ formattedFinalPrice }}</p>
<p>{{ ratingText }}</p>
<p>{{ soldText }}</p>
```

### 9. Gunakan shared composables (bukan duplikasi logic)

Jangan copy computed properties ke theme shell. Gunakan shared composables di gateway:

| Composable | Export | Dipakai di |
|------------|--------|------------|
| `useTheme('SlotName')` | `{ resolvedComponent }` | Semua gateway |
| `useCartBadge()` | `{ badgeCount, badgeLabel }` | AppHeader, AppBottomNav |
| `useStoreSchema()` | `{ isSimaskoEnabled, storeTheme }` | AppHeader, AppBottomNav, SimaskoSection |
| `useProductDisplay(product)` | `{ hasDiscount, formattedFinalPrice, ratingText, ... }` | Item, ItemSmall, Detail |

> **Props khusus Detail.vue:** `variantGroups` (computed group → options mapping), `selectedOptionForGroup(group)` (function), `groupLabel(group)` (function) — semua sudah di-inject via `defineProps` dari gateway. Theme shell tinggal pakai di template.

### 10. Gunakan emit wrapper functions untuk aksi

```vue
<script setup lang="ts">
const emit = defineEmits<{ closeSearch: [] }>()
const onCloseSearch = () => emit('closeSearch')
</script>
<template>
  <UButton @click="onCloseSearch" />
</template>
```

### 11. Gunakan v-model untuk Nuxt UI components

```vue
<UInput v-model="searchQuery" />
<UPopover v-model:open="isSearchOpen" />
<UModal v-model:open="isModalOpen" />
<UDropdownMenu v-model:open="isLocaleOpen" />
```

### 12. Update preview theme (dev only)

Tambahkan pilihan theme baru di `app/app.vue` untuk preview di mode dev.

### 13. Testing manual

Uji minimal:
- AppHeader (pakai UHeader — responsive built-in, tanpa useDevice)
- AppBottomNav (mobile-only, lg:hidden)
- AppFooter
- ProductItem, ProductItemSmall
- Home banner, simasko section, product grid
- Product Detail

## Shared Components

`app/components/product/DetailCarousel.vue` dan `DetailReview.vue` adalah komponen **shared** yang sudah terintegrasi di ProductDetail — tidak perlu varian theme.

## Troubleshooting

- **Theme tidak berubah**: cek `resolveStoreTheme()` di `app/utils/store-theme.ts` dan `data-store-theme` attribute.
- **Warna tidak sesuai**: pastikan `data-store-theme` terpasang dan CSS palette ada di `app/assets/css/main.css`.
- **Komponen tidak ter-render**: cek bahwa key di `theme-registry.ts` sudah ditambahkan untuk theme baru.
- **Error "props not found"**: cek bahwa props interface di theme variant identik dengan yang dilempar gateway.
- **i18n tidak muncul**: gunakan `t()` dari `useI18n()`.
- **defineModel tidak sync**: pastikan gateway menggunakan `v-model:xxx` bukan `:xxx`.
- **Warning/stars berubah warna**: `text-warning` menggunakan dedicated Amber palette, bukan `secondary`. Jangan override `warning` color mapping di `app.config.ts`.
