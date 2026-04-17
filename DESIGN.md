# Design Brief: SliceRush

## Direction & Tone
Bold, modern food-focused premium brand—warm, confident, energetic. Domino's-inspired warmth meets contemporary tech. Image-dominant Pinterest-style commerce UI extended with enterprise-grade admin dashboard maintaining visual consistency.

## Palette

| Role | Light | Dark |
|------|-------|------|
| Primary (deep red) | `0.52 0.22 24` | `0.65 0.19 28` |
| Secondary (warm orange) | `0.64 0.18 48` | `0.72 0.16 50` |
| Background | `0.98 0.01 45` | `0.12 0.01 25` |
| Card | `0.99 0.01 45` | `0.16 0.01 28` |
| Foreground | `0.18 0.02 32` | `0.92 0.01 40` |
| Muted | `0.88 0.02 30` | `0.24 0.02 28` |
| Border | `0.92 0.01 40` | `0.22 0.01 26` |
| Success | — | `0.68 0.15 135` (green) |
| Warning | — | `0.72 0.18 65` (amber) |
| Info | — | `0.72 0.16 50` (orange) |

## Typography
- **Display**: Fraunces (editorial serif for warmth & sophistication)
- **Body**: DM Sans (modern, legible, commerce-focused)
- **Mono**: JetBrains Mono (technical components, data tables)

## Shape & Spacing
- Border radius: 12px (cards & table containers), 4px (controls, badges)
- Admin density: Generous card padding (1.5rem), compact table rows (0.875rem)
- Image-forward customer UI; data-forward admin UI

## Structural Zones

| Zone | Treatment |
|------|-----------|
| Header (Customer) | Sticky top, dark card surface, primary logo, subtle border-b |
| Header (Admin) | Sticky dark card, logo + "Admin" label, breadcrumb nav |
| Sidebar (Admin) | Navigation pills (Dashboard, Products, Coupons, Orders, Users), active=primary, smooth transitions |
| Grid (Main - Customer) | Card-based layout, large images (16:9), minimal text, hover lift |
| Grid (Main - Admin) | KPI cards (4-col, left accent bar in primary), line chart below, full responsive |
| Table Container (Admin) | Card surface, striped rows, hover highlight in table-row-hover, border dividers |
| Mobile Bottom (Customer) | Sticky cart indicator with item count & total |
| Modal/Form (Admin) | Popover surface, elevated shadow, form inputs on input background |
| Cart Drawer (Customer) | Slide-in from right (desktop) or bottom (mobile), semi-transparent overlay |

## Component Patterns - Customer
- **Cards**: Image-forward (100% width, 16:9 aspect), text overlay bottom (semi-transparent gradient), price in primary, add-to-cart on hover
- **Skeleton**: Muted pulse animation, same dimensions as target
- **Buttons**: Primary (red, full width on cards), secondary (ghost on hover), destructive (high chroma red)
- **Category Pill**: Muted base, primary bg on active, smooth transition
- **Order Review Modal**: Centered overlay, card surface with top accent bar gradient (primary→accent), 5-star rating (star-pop 300ms anim on hover), text-lg font display title, submit button primary, cancel secondary
- **Notifications Panel**: Slide-in-right 400ms from right edge, sticky header with bell icon + unread badge (glow-accent pulse), stacked notification cards with left accent border, unread state uses primary/10 bg
- **Promotional Banner Carousel**: 16:9 aspect, smooth carousel-slide transitions, gradient overlay (black/60 to transparent), dot indicators (active=accent, wide), CTA button primary on overlay
- **Profile Management**: Header with gradient bg (primary/30→accent/20), floating avatar (-bottom-12, shadow), sections for personal info/addresses (card surface, profile-field inputs with focus ring), edit buttons secondary
- **Quick Reorder Button**: Compact (px-4 py-2.5), accent color with hover glow-accent animation, icon + label, border-accent/30 default, hover brings to border-accent/60

## Component Patterns - Admin
- **KPI Card**: Card surface, relative positioning, left accent bar (1px primary), headline + metric + trend arrow
- **Table Row**: 1px border-bottom, even rows get table-row-stripe bg, hover fills table-row-hover, clickable expand icon (chevron)
- **Status Badge**: 4 types (success=green, warning=amber, info=orange, destructive=red), lowOpacity bg with full-color text
- **Action Buttons**: Icon buttons (edit, delete, view) in secondary or destructive, grouped right-aligned in table cells
- **Modal Form**: Popover surface, full-width inputs, form grid layout, cancel/submit buttons (secondary & primary)
- **Chart**: Uses chart-1 through chart-5 tokens, line chart for revenue, bar chart for order volume

## Motion & Animation
- Card hover: scale 1.02, elevated shadow, 300ms ease
- Table row expand: expand-down 300ms ease-out
- Modal open: scale-in 200ms ease-out; review modal accents: fade-in 300ms from top
- Status change: fade-in 300ms
- Skeleton fade: pulse 1.5s
- Drawer open: slide-in-right 400ms cubic-bezier (notifications panel)
- Page transition: fade-in 300ms
- Star rating hover: star-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) for playful spring effect
- Notification badge: badge-pulse 600ms ease-in-out infinite for unread indicator
- Quick reorder hover: glow-accent 2s ease-in-out infinite (warm orange radial pulse)
- Carousel slide transition: carousel-slide 500ms ease-out per image
- No gradients; smooth color transitions only

## Differentiation
Customer UI: Food photography as hero, warm color blocking, minimal UI chrome, aggressive image-to-text ratio. Admin UI: No-nonsense data tables with warm red accents for CTAs, card-based KPI dashboard, status badges with semantic colors, enterprise scannability while maintaining SliceRush warmth.

## Constraints
- No purple/cool tones
- No gradients (solid color blocking only)
- Warm color palette always (red/orange hues)
- Admin tables: warm accents only, no teal/blue status colors
- Generous padding on customer cards, compact admin tables
- Dark mode as first-class citizen
- Images dominate customer experience; typography dominates admin
