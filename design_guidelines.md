# Airport Transfer Landing Page - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from professional booking platforms (Booking.com, Kayak) combined with premium transportation services (Uber Black, Blacklane). The design emphasizes trust, professionalism, and booking efficiency.

**Core Principle**: Clean, conversion-focused layout that prioritizes the booking form while maintaining premium brand perception through professional imagery and generous whitespace.

---

## Typography System

**Font Stack**: Use Google Fonts - Poppins for headings, Inter for body text

**Hierarchy**:
- Hero Headline: 3xl/4xl, semibold (Poppins)
- Section Headlines: 2xl/3xl, semibold (Poppins)
- Feature Titles: lg/xl, medium (Poppins)
- Body Text: base, regular (Inter)
- Form Labels: sm, medium (Inter)
- Button Text: base, semibold (Poppins)
- Footer Text: sm, regular (Inter)

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

**Container Strategy**:
- Full-width sections with inner max-w-7xl containers
- Hero section: Full viewport width with centered max-w-6xl booking form
- Content sections: max-w-7xl with px-6 lg:px-8
- Forms: max-w-4xl for optimal readability

**Section Padding**:
- Hero: py-20 lg:py-32
- Content sections: py-16 lg:py-24
- CTA banner: py-12 lg:py-16
- Footer: py-12

---

## Images

**Hero Image**: Large, professional photograph showing business professionals in modern airport terminal setting. Image should convey trust, professionalism, and premium service. Position: Background with subtle overlay to ensure form readability. Dimensions: Full viewport width, minimum 800px height.

**Vehicle Fleet Images**: Three high-quality vehicle photographs:
1. Standard sedan (Mercedes E-Class or similar) - professional angle showing exterior
2. Luxury sedan (Mercedes S-Class or BMW 7-series) - premium positioning
3. Minivan/MPV (Mercedes V-Class or similar) - spacious interior visible

Vehicle images should be consistent in style, lighting, and angle. Use 4:3 aspect ratio cards.

**Feature Icons**: Use Heroicons (outline style) - Dollar sign (pricing), Shield check (guarantee), Star (comfort)

---

## Component Library

### Hero Section
- Split layout: Left side with headline + subheading, right side with prominent booking form
- Booking form elevated with shadow and background treatment
- Form fields: Location inputs with icon prefix, dropdown selectors, date/time pickers, number stepper for passengers
- Primary CTA button at form bottom, full width
- Buttons on images: Use backdrop blur (backdrop-blur-sm) with semi-transparent background

### Features Section
- 3-column grid on desktop (grid-cols-1 md:grid-cols-3)
- Each feature card: Icon at top, title, 2-line description
- Centered alignment, generous padding between cards (gap-8 lg:gap-12)

### Vehicle Fleet Showcase
- 3-column grid layout (grid-cols-1 md:grid-cols-3, gap-6 lg:gap-8)
- Card structure: Vehicle image (aspect-video), title, passenger capacity badge, 2-3 feature bullets, price indicator, "Select" button
- Cards with subtle border and hover elevation effect

### CTA Banner Section
- Full-width colored background section
- Centered content: Large headline + supporting text + primary button
- Generous vertical padding (py-16)

### Footer
- 3-column layout: Company info + Quick Links + Contact details
- Logo at top left
- Social media icons (right-aligned, use Font Awesome)
- Bottom bar with copyright text

---

## Form Components

**Input Fields**:
- Height: h-12
- Padding: px-4
- Border radius: rounded-lg
- Border: 1 pixel solid
- Focus state: Ring implementation (ring-2)

**Dropdowns**:
- Custom select styling matching input fields
- Chevron icon on right
- Padding to accommodate icon

**Date/Time Pickers**:
- Calendar icon prefix
- Placeholder text in lighter weight
- Match input field styling

**Buttons**:
- Primary: px-8 py-3, rounded-lg, semibold text
- Secondary: Similar sizing with outlined variant
- Hover states: Slight transform and shadow enhancement

---

## Responsive Behavior

**Breakpoints**:
- Mobile: Single column stacking
- Tablet (md): 2-column where appropriate
- Desktop (lg): Full multi-column layouts

**Hero Adjustments**:
- Mobile: Stacked layout, form below headline
- Desktop: Side-by-side split

**Vehicle Grid**:
- Mobile: Single column cards
- Tablet: 2 columns
- Desktop: 3 columns

---

## Accessibility

- All form inputs with proper labels (visible or aria-label)
- Sufficient contrast ratios throughout
- Focus indicators on all interactive elements
- Semantic HTML structure (header, main, footer, section)
- Alt text for all vehicle and hero images

---

## Animation Strategy

**Minimal, purposeful animations only**:
- Subtle fade-in on scroll for feature cards (use intersection observer)
- Button hover: Slight scale (scale-105) and shadow enhancement
- Vehicle card hover: Elevation increase
- Form focus states: Smooth ring transition

**No animations on**:
- Hero section load
- Background effects
- Scroll-triggered parallax
- Complex transitions

This creates a professional, trustworthy booking experience that prioritizes conversion while maintaining premium brand positioning.