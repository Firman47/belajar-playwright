# Multi-Theme Architecture

**Status:** Implemented  
**Stack:** Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4 + TypeScript

---

## 1. Konsep

Multi-theme memungkinkan website memiliki tampilan dan struktur HTML yang berbeda-beda tergantung theme yang aktif (saat ini: `default`, `simasko`, `bazaar`, `medical`, `fresh`, dan `luxe`).

Perbedaan dengan theme saat ini (Nuxt UI config):
| Aspek | Nuxt UI Config | Multi-Theme |
|-------|---------------|-------------|
| Warna | ✅ Bisa | ✅ Bisa |
| Style komponen UI | ✅ Bisa (rounded, border, dll) | ✅ Bisa |
| Struktur HTML | ❌ Tidak bisa | ✅ Bisa |
| Layout berbeda | ❌ Tidak bisa | ✅ Bisa |
| Hide/show section | ❌ Tidak bisa | ✅ Bisa |
| Component variant | ❌ Tidak bisa | ✅ Bisa |

---

## 2. Arsitektur

### Gateway = Logic Holder

Setiap komponen yang punya varian theme memiliki **gateway** yang bertindak sebagai logic holder:

```
Gateway component (LOGIC HOLDER)
  ├── All logic: composables, refs, computed, watchers, API calls
  ├── Pre-compute display values sebagai props
  ├── v-model:xxx binding untuk state dua arah (defineModel)
  ├── @event binding untuk aksi satu arah (emit)
  │
  ├── themes/default/<Component>.vue -> TEMPLATE + defineModel + defineProps + defineEmits
  └── themes/simasko/<Component>.vue -> TEMPLATE + defineModel + defineProps + defineEmits
```

### Theme Registry

Semua gateway menggunakan **Theme Registry** (`app/utils/theme-registry.ts`) untuk resolve komponen theme secara otomatis — tanpa `v-if`/`v-else-if` chain.

```ts
// app/utils/theme-registry.ts
const THEME_COMPONENT_REGISTRY: Record<string, Record<string, Component>> = {
  ProductItem: { default: ThemesDefaultProductItem, simasko: ThemesSimaskoProductItem },
  HomeLayout: { default: ThemesDefaultHomeLayout, simasko: ThemesSimaskoHomeLayout },
  // ...
}
```

Gateway (menggunakan `useTheme()` composable — **cara baru, recommended**):

```vue
<template>
  <component :is="resolvedComponent" v-bind="props" />
</template>
<script setup lang="ts">
const { resolvedComponent } = useTheme('ProductItem')
</script>
```

Gateway (tanpa composable — **cara lama,** untuk komponen yang butuh `activeTheme` secara terpisah):

```vue
<template>
  <component :is="resolvedComponent" v-bind="props" />
</template>
<script setup lang="ts">
import { resolveThemeComponent } from '~/utils/theme-registry'
import { resolveStoreTheme } from '~/utils/store-theme'

const { storeProfile } = useStoreProfile()
const activeTheme = computed(() => resolveStoreTheme(storeProfile.value?.config?.theme))
const resolvedComponent = computed(() => resolveThemeComponent('ProductItem', activeTheme.value))
</script>
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

### Directory Structure

```
app/
├── utils/
│   ├── store-theme.ts             # resolveStoreTheme() + StoreThemeName type
│   ├── theme-registry.ts          # Theme component registry (#components import)
│   └── theme-config.ts            # [DELETED] — diganti store-theme.ts
│
├── composables/
│   └── useStoreTheme.ts           # [DELETED] — tidak dipakai lagi
│
    └── components/
    ├── themes/
    │   ├── default/                   # Blue primary — clean, professional
    │   │   ├── app/                   # Header, Footer, BottomNav, CategoryPage
    │   │   ├── product/               # Item, ItemSmall, Detail
    │   │   └── home/                  # Layout, BannerSection, SimaskoSection,
    │   │                              # CategorySidebar, ProductGrid
    │   │
    │   ├── simasko/                   # Indigo primary — modern, tech-forward
    │   ├── bazaar/                    # Rose primary — warm marketplace
    │   ├── medical/                   # Teal primary — clean health
    │   ├── fresh/                     # Orange primary — food & beverage (Nunito Sans)
    │   └── luxe/                      # Dark charcoal + gold — editorial luxury
    │       (same app/product/home structure)
    │
    ├── app/                            # GATEWAY (logic holder)
    │   ├── AppHeader.vue
    │   ├── AppFooter.vue
    │   └── CategoryPage.vue
    ├── product/
    │   ├── Item.vue                    # GATEWAY
    │   ├── ItemSmall.vue               # GATEWAY
    │   ├── Detail.vue                  # GATEWAY
    │   ├── DetailCarousel.vue          # SHARED component
    │   └── DetailReview.vue            # SHARED component
    ├── home/
    │   ├── BannerSection.vue           # GATEWAY
    │   ├── SimaskoSection.vue          # GATEWAY
    │   ├── CategorySidebar.vue         # GATEWAY
    │   ├── ProductGrid.vue             # GATEWAY
    │   └── Layout.vue                  # GATEWAY (home page layout)
    └── setting/
        └── Address.vue                 # GATEWAY
```

### Shared Logic Composables

Untuk menghindari duplikasi logic antar komponen, gunakan **shared composables**:

#### `useTheme(name)` — Theme resolution boilerplate

```ts
// app/composables/useTheme.ts
export function useTheme(slotName?: string) {
  const { storeProfile } = useStoreProfile()
  const activeTheme = computed(() => resolveStoreTheme(storeProfile.value?.config?.theme))
  const resolvedComponent = slotName
    ? computed(() => resolveThemeComponent(slotName, activeTheme.value))
    : undefined
  return { activeTheme, resolveComponent, resolvedComponent }
}
```

#### `useCartBadge()` — Cart badge count + label

```ts
// app/composables/useCartBadge.ts
export function useCartBadge() {
  const { cart } = useCart()
  const badgeCount = computed(() => {
    /* ... */
  })
  const badgeLabel = computed(() => (badgeCount.value > 99 ? '99' : String(badgeCount.value)))
  return { badgeCount, badgeLabel }
}
```

Digunakan oleh: `AppHeader`, `AppBottomNav`. Menghilangkan duplikasi `cartBadgeCount` dan `cartBadgeLabel` computed.

#### `useStoreSchema()` — Store schema/feature flags

```ts
// app/composables/useStoreSchema.ts
export function useStoreSchema() {
  const { storeProfile } = useStoreProfile()
  const isSimaskoEnabled = computed(
    () => storeProfile.value?.config?.schema?.includes('SIMASKO') === true
  )
  return { isSimaskoEnabled, storeTheme }
}
```

Digunakan oleh: `AppHeader`, `AppBottomNav`, `SimaskoSection`.

#### `useProductDisplay(product)` — Product display pre-computed values

```ts
// app/composables/useProductDisplay.ts
export function useProductDisplay<T extends ProductLike | null>(product: Ref<T>) {
  return {
    hasDiscount, // computed — ada diskon?
    finalPrice, // computed — harga setelah diskon (number)
    formattedFinalPrice, // computed — formatToRupiah(finalPrice)
    formattedOriginalPrice, // computed — formatToRupiah(product.price)
    formattedRating, // computed — formatRatingValue
    hasReviewMeta, // computed — ada rating atau sold_count?
    ratingText, // computed — "4.8" atau "Belum ada rating"
    soldText, // computed — "Terjual 1.2rb" atau ""
    highlightBadge, // computed — Best Seller / Baru / null
  }
}
```

Digunakan oleh: `product/Item.vue`, `product/ItemSmall.vue`, `product/Detail.vue`.

### Auto-import Convention

Nuxt auto-import akan membuat nama komponen sesuai path:

| Path                                               | Auto-import Name                 |
| -------------------------------------------------- | -------------------------------- |
| `components/themes/default/product/Item.vue`       | `ThemesDefaultProductItem`       |
| `components/themes/simasko/product/Item.vue`       | `ThemesSimaskoProductItem`       |
| `components/themes/bazaar/product/Item.vue`        | `ThemesBazaarProductItem`        |
| `components/themes/default/app/Header.vue`         | `ThemesDefaultAppHeader`         |
| `components/themes/simasko/app/Header.vue`         | `ThemesSimaskoAppHeader`         |
| `components/themes/bazaar/app/Header.vue`          | `ThemesBazaarAppHeader`          |
| `components/themes/default/home/BannerSection.vue` | `ThemesDefaultHomeBannerSection` |
| `components/themes/bazaar/home/BannerSection.vue`  | `ThemesBazaarHomeBannerSection`  |

---

## 3. Gateway Component Pattern

Gateway menggunakan `<component :is>` dengan **Theme Registry** via `useTheme()` composable — tanpa `v-if`/`v-else-if`:

```vue
<!-- components/product/Item.vue — GATEWAY -->
<script setup lang="ts">
// useTheme() composable — ganti 4 lines boilerplate jadi 1 line
const { resolvedComponent } = useTheme('ProductItem')
const { withStorePath } = useStorePath()
const props = defineProps<{ product: ProductCard }>()

// Gunakan shared composable untuk pre-compute display values
const productRef = computed(() => props.product)
const { hasDiscount, formattedFinalPrice, hasReviewMeta, ratingText, soldText, highlightBadge } =
  useProductDisplay(productRef)

const productItemProps = computed(() => ({
  product: props.product,
  hasDiscount: hasDiscount.value,
  formattedFinalPrice: formattedFinalPrice.value,
  productUrl: withStorePath(`/${props.product.slug}`),
  hasReviewMeta: hasReviewMeta.value,
  ratingText: ratingText.value,
  soldText: soldText.value,
  highlightBadge: highlightBadge.value,
}))
</script>
<template>
  <component :is="resolvedComponent" v-bind="productItemProps" />
</template>
```

**Semua display values sudah pre-computed** — theme shell tinggal render:

```vue
<!-- themes/default/product/Item.vue — THEME SHELL -->
<script setup lang="ts">
defineProps<{
  product: ProductCard
  hasDiscount: boolean
  formattedFinalPrice: string
  productUrl: string
  hasReviewMeta: boolean
  ratingText: string
  soldText: string
  highlightBadge: { label: string; color: 'warning' | 'primary' } | null
}>()
</script>
<template>
  <!-- Hanya template, tidak ada computed / logic / import -->
  <NuxtLink :to="productUrl">
    <p class="font-heading text-primary-600">{{ formattedFinalPrice }}</p>
    <span>{{ ratingText }}</span>
    <span>{{ soldText }}</span>
  </NuxtLink>
</template>
```

Untuk komponen dengan state dua arah:

```vue
<!-- components/app/AppHeader.vue — GATEWAY -->
<script setup lang="ts">
const { resolvedComponent } = useTheme('AppHeader')
const { isSimaskoEnabled } = useStoreSchema()
const { badgeCount: cartBadgeCount, badgeLabel: cartBadgeLabel } = useCartBadge()
const searchQuery = ref('')
</script>
<template>
  <component
    :is="resolvedComponent"
    v-model:search-query="searchQuery"
    :cart-badge-count="cartBadgeCount"
    :cart-badge-label="cartBadgeLabel"
    :is-simasko-enabled="isSimaskoEnabled"
    @close-search="closeSearch"
  />
</template>
```

### Aturan Gateway

1. **Gateway adalah logic holder** — semua composables, computed, watchers, API calls ada di sini
2. **`<component :is>` + `useTheme()`** — untuk resolve varian theme, bukan `v-if`/`v-else-if`
3. **Shared composables** — gunakan `useCartBadge()`, `useStoreSchema()`, `useProductDisplay()` untuk logic yang dipakai banyak komponen
4. **defineModel** untuk state dua arah (v-model)
5. **Props** untuk data read-only (pre-computed dari gateway)
6. **Emits + wrapper function** untuk aksi satu arah
7. **Default theme adalah fallback** — jika theme tidak ada di registry, render default
8. **Tidak ada import silang** antar folder theme

---

## 4. Theme Registry

`app/utils/theme-registry.ts` menyimpan mapping semua komponen theme dengan import dari `#components`:

```ts
import type { Component } from 'vue'
import {
  ThemesDefaultAppHeader,
  ThemesSimaskoAppHeader,
  ThemesDefaultProductItem,
  ThemesSimaskoProductItem,
  // ...
} from '#components'

const THEME_COMPONENT_REGISTRY: Record<string, Record<string, Component>> = {
  AppHeader: { default: ThemesDefaultAppHeader, simasko: ThemesSimaskoAppHeader },
  ProductItem: { default: ThemesDefaultProductItem, simasko: ThemesSimaskoProductItem },
  // ...
}

export function resolveThemeComponent(componentName: string, theme: string): Component {
  const entry = THEME_COMPONENT_REGISTRY[componentName]
  if (!entry) throw new Error(`Theme component not found: ${componentName}`)
  return entry[theme] ?? entry.default!
}
```

### Menambah Theme Baru ke Registry

Cukup tambah 1 baris per komponen + import dari `#components`:

```ts
import {
  ThemesDefaultProductItem,
  ThemesSimaskoProductItem,
  ThemesBaruProductItem,
} from '#components'

const THEME_COMPONENT_REGISTRY: Record<string, Record<string, Component>> = {
  ProductItem: {
    default: ThemesDefaultProductItem,
    simasko: ThemesSimaskoProductItem,
    '<baru>': ThemesBaruProductItem, // <-- baris baru
  },
  // ...
}
```

---

## 5. Responsive Design

**Header menggunakan `UHeader` dari Nuxt UI** — responsive built-in tanpa `useDevice()`:

| Ukuran Layar     | Behavior                                                      |
| ---------------- | ------------------------------------------------------------- |
| Desktop (`lg:`)  | Full header: Logo + Category + Search + Cart + User           |
| Mobile (< `lg:`) | Drawer menu: hamburger toggle, search + kategori di body slot |

CSS-based responsive (`hidden lg:flex`, `block lg:hidden`) menggantikan JS-based `useDevice()`.

---

## 6. Component Scope

| Komponen             | Key Registry       | Path Gateway               | Variasi                                                                                    |
| -------------------- | ------------------ | -------------------------- | ------------------------------------------------------------------------------------------ |
| **AppHeader**        | `AppHeader`        | `app/AppHeader.vue`        | UHeader, icon color, button variant; mobile: context-aware with back button                |
| **AppBottomNav**     | `AppBottomNav`     | `app/AppBottomNav.vue`     | Mobile-only bottom nav (lg:hidden); 5 items: Home, Categories, Orders, PC Builder, Profile |
| **AppFooter**        | `AppFooter`        | `app/AppFooter.vue`        | 4-column layout: Brand, Belanja, Dukungan, Lokasi                                          |
| **CategoryPage**     | `CategoryPage`     | `app/CategoryPage.vue`     | Grid columns, color accent; bazaar: horizontal pills, no sidebar                           |
| **ProductItem**      | `ProductItem`      | `product/Item.vue`         | Vertical card; bazaar: + "Beli" button                                                     |
| **ProductItemSmall** | `ProductItemSmall` | `product/ItemSmall.vue`    | Color accent                                                                               |
| **ProductDetail**    | `ProductDetail`    | `product/Detail.vue`       | Detail page layout, color accent                                                           |
| **BannerSection**    | `BannerSection`    | `home/BannerSection.vue`   | Aspect ratio, skeleton style; bazaar: 2×2 grid desktop                                     |
| **SimaskoSection**   | `SimaskoSection`   | `home/SimaskoSection.vue`  | Icon, color, button variant                                                                |
| **CategorySidebar**  | `CategorySidebar`  | `home/CategorySidebar.vue` | Color accent; bazaar: horizontal scroll strip                                              |
| **ProductGrid**      | `ProductGrid`      | `home/ProductGrid.vue`     | Grid columns, empty state style                                                            |
| **HomeLayout**       | `HomeLayout`       | `home/Layout.vue`          | Full home page layout; bazaar: flash sale, no sidebar                                      |

---

## 7. Hubungan dengan Nuxt UI Config

Multi-theme tidak menggantikan Nuxt UI config override. Keduanya saling melengkapi:

| Layer                                | Fungsi                  | Contoh Efek                                            |
| ------------------------------------ | ----------------------- | ------------------------------------------------------ |
| **CSS custom properties**            | Warna dasar theme       | `--color-primary-500` = Blue vs Indigo vs Rose         |
| **Nuxt UI config** (`app.config.ts`) | Style komponen UI dasar | Button rounded, Card border, Input style               |
| **Theme component** (`themes/*/`)    | Struktur HTML berbeda   | Header 3 kolom vs 2 kolom, Card vertikal vs horizontal |

---

## 8. Aturan Pengembangan

1. **Gateway = Logic Holder**. Semua logic hanya di gateway.
2. **`<component :is>` + Theme Registry** — jangan pakai `v-if`/`v-else-if`.
3. **defineModel** untuk state dua arah (searchQuery, isSearchOpen, dll).
4. **defineProps** untuk data read-only (categoryItems, cartBadgeCount, dll).
5. **defineEmits + wrapper function** untuk aksi (closeSearch, confirmLogout, dll).
6. **Gunakan Nuxt UI components** — jangan buat custom jika Nuxt UI sudah punya.
7. **Gunakan `UHeader`** yang responsive built-in — tanpa `useDevice()`.
8. **CSS-based responsive** — `hidden md:block`, `lg:hidden`, dll.
9. **Shared logic via composables** — jangan duplikasi logic di theme variants.

---

## 9. Shared Components (Tidak Perlu Varian)

```
components/
├── product/
│   ├── DetailCarousel.vue      # Image carousel + zoom (shared, used in ProductDetail)
│   └── DetailReview.vue        # Review list + filter + pagination (shared, used in ProductDetail)
├── setting/
│   ├── AddressForm.vue         # Form fields logic (shared)
│   ├── AddressList.vue         # Address list layout (shared)
│   └── AddressMapPicker.vue    # Leaflet map picker (shared)
├── auth/
│   └── Login.vue               # Login form (shared)
├── Modal/
│   └── Confirm.vue             # Dialog konfirmasi (shared)
└── transaction/
    └── Tracking.vue             # Tracking timeline (shared)
```

---

## 10. Catatan Setting Component

Setting components bersifat hybrid — hanya wrapper Address yang perlu varian theme:

```
components/
├── themes/
│   ├── default/setting/Address.vue    # Varian theme untuk Address wrapper
│   └── simasko/setting/Address.vue
├── setting/
│   ├── Address.vue                    # GATEWAY
│   ├── AddressForm.vue                # SHARED
│   ├── AddressList.vue                # SHARED
│   └── AddressMapPicker.vue           # SHARED
```

---

## 11. Catatan Penggunaan `defineModel`

`defineModel` digunakan untuk state yang perlu dua arah binding antara gateway dan theme variant:

```ts
// Theme variant
const searchQuery = defineModel<string>('searchQuery', { default: '' })
const isSearchOpen = defineModel<boolean>('isSearchOpen', { default: false })
const isCategoryOpen = defineModel<boolean>('isCategoryOpen', { default: false })
```

Keuntungan:

- Tidak perlu `props` + computed get/set + `emit('update:xxx')`
- Langsung bisa pakai `v-model` di template
- Semua perubahan state otomatis sync ke gateway

---

## 12. Implementasi Steps

```
1. Buat folder structure themes/default/ dan themes/simasko/
2. Copy komponen existing ke themes/default/ (sebagai base)
3. Buat gateway components di path asli dengan `<component :is>` + Theme Registry
4. Pindahkan logic ke gateway (logic holder pattern)
5. Implementasi defineModel untuk state dua arah
6. Hapus useDevice(), pakai UHeader responsive
7. Buat shared components (DetailCarousel, DetailReview)
8. Implementasi varian simasko untuk komponen yang berbeda
9. Test setiap halaman dengan kedua theme
```
