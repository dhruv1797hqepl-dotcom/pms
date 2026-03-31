# Responsive Design Guidelines for HQEPL Frontend

## Overview
This document outlines best practices for ensuring all pages are responsive across device sizes, with special optimization for:
- **13-14 inch laptops** (1200-1440px)
- **Small laptops** (1024-1200px) 
- **Tablets** (768-1024px)
- **Mobile phones** (320-640px)

## Layout Structure

### Desktop & Laptop (13"+)
- **Sidebar**: Always visible on left side
- **Main Content**: Takes remaining space (flex-1)
- **Padding**: `px-4 md:px-6 lg:px-10`
- **Max Width**: `max-w-[1400px] xl:max-w-[1600px]`

### Mobile & Small Screens
- **Sidebar**: Hidden, hamburger menu (☰) visible
- **Menu**: Slides in from left when hamburger is clicked
- **Content**: Full width with tight padding (`px-2 sm:px-3`)
- **Navigation**: Optimized touch targets (44px minimum)

### Recommended Layout Template

```jsx
import ResponsiveLayout from '../../components/ResponsiveLayout';

const MyPage = () => {
  return (
    <ResponsiveLayout>
      {/* Your content here */}
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Page Title</h1>
    </ResponsiveLayout>
  );
};

export default MyPage;
```

## Responsive Spacing & Text Classes

### Text Sizing
```jsx
// Responsive heading
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">

// Responsive paragraph
<p className="text-sm sm:text-base md:text-lg">

// Small text
<span className="text-xs sm:text-sm">
```

### Spacing (Padding/Margin)
```jsx
// Container padding
<div className="px-2 sm:px-4 md:px-6 lg:px-10">

// Vertical spacing
<div className="py-3 sm:py-4 md:py-6">

// Gap between items
<div className="gap-2 sm:gap-3 md:gap-4 lg:gap-6">

// Responsive utility classes
<div className="space-y-4 sm:space-y-6 md:space-y-8">
```

## Breakpoints
Based on Tailwind CSS defaults:
- `sm`: 640px
- `md`: 768px (Sidebar appears)
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Table Responsiveness

### For Data Tables on Small Screens
```jsx
<div className="responsive-table-wrapper">
  <table className="w-full text-sm">
    <thead>
      <tr>
        <th className="px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-xs">
          Column Header
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="px-2 sm:px-4 py-2 sm:py-3">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

The `.responsive-table-wrapper` class from `index.css` handles scrolling.

## Forms & Inputs

### Responsive Form Layout
```jsx
<form className="space-y-3 sm:space-y-4">
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-2">Label</label>
    <input 
      type="text" 
      className="px-3 py-2.5 border rounded-lg focus:outline-none focus:border-blue-500"
    />
  </div>
</form>
```

### Button Sizing
```jsx
// Responsive button
<button className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm">
  Click Me
</button>

// Always ensure minimum 44px touch target
button { min-height: 44px; }
```

## Modal Dialogs

### Safe Responsive Modal
```jsx
<div className="fixed inset-0 z-[100] flex items-center justify-center px-3 sm:px-4">
  <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl max-w-3xl w-full p-4 sm:p-6 md:p-8">
    {/* Modal content */}
  </div>
</div>
```

## Common Responsive Patterns

### Hidden Elements
```jsx
{/* Hide on mobile, show on desktop */}
<div className="hidden md:block">Desktop only</div>

{/* Show on mobile, hide on desktop */}
<div className="md:hidden">Mobile only</div>
```

### Flex Stacking
```jsx
{/* Stack on mobile, row on desktop */}
<div className="flex flex-col md:flex-row gap-3 md:gap-6">
  <div className="w-full md:w-1/2">Half width on desktop</div>
  <div className="w-full md:w-1/2">Half width on desktop</div>
</div>
```

### Conditional Rendering
```jsx
// Show different content based on screen size
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? <MobileNav /> : <DesktopNav />;
```

## Optimization Tips for 13-14 Inch Screens

1. **Width Management**: Use responsive max-widths
   ```jsx
   <div className="max-w-[1400px] mx-auto">
   ```

2. **Sidebar Consideration**: Always account for sidebar width (250px or 80px collapsed)
   ```jsx
   /* Sidebar pushes content to right on desktop */
   <main className="flex-1"> {/* Takes remaining space */}
   ```

3. **Table Column Width**: Use minimum widths to prevent crushing
   ```jsx
   <th className="min-w-[150px] px-4">Wide enough header</th>
   ```

4. **Text Truncation**: Prevent text overflow
   ```jsx
   <p className="truncate">Long text...</p>
   <p className="line-clamp-2">Limited lines</p>
   ```

5. **Icon Sizing**: Scale icons with text
   ```jsx
   <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
   ```

## CSS Responsive Utilities Added

Available in `index.css`:

- `.responsive-table-wrapper` - Scrollable table container
- `.responsive-container` - Flexible container with responsive padding
- `.responsive-grid` - Grid with responsive gaps
- `.responsive-modal` - Modal with responsive sizing
- `.btn-responsive` - Responsive button sizing
- `.text-responsive-lg/md/sm` - Responsive text sizing
- `.flex-responsive` - Stack on mobile, row on desktop
- `.hidden-mobile` - Auto-hidden on mobile

## Testing Responsive Design

### Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at various viewport widths:
   - 375px (Mobile)
   - 640px (Small tablet)
   - 768px (Tablet/Sidebar appears)
   - 1024px (Laptop)
   - 1440px (13-14" laptop)

### Real Device Testing
Test on actual devices when possible:
- iPhone SE, iPhone 13, iPhone 15
- iPad Mini, iPad Air
- 13-14" laptop (actual target)
- 27" monitor (desktop)

## Accessibility Considerations

1. **Touch Targets**: Minimum 44x44px on mobile
2. **Font Size**: Never less than 12px for body text
3. **Contrast**: Maintain WCAG AA contrast ratio
4. **Focus States**: Always visible focus outline
5. **Line Height**: 1.4-1.6 for readability

## Common Mistakes to Avoid

❌ **DON'T**: Use fixed widths
```jsx
<div style={{ width: '500px' }}>Not responsive</div>
```

✅ **DO**: Use responsive classes
```jsx
<div className="w-full md:w-1/2 lg:w-1/3">Responsive</div>
```

---

❌ **DON'T**: Forget about sidebar when calculating widths
```jsx
<div className="max-w-7xl"> {/* May overflow on small screens */}
```

✅ **DO**: Account for sidebar in layout
```jsx
<ResponsiveLayout>
  {/* Content auto-adjusted for sidebar */}
</ResponsiveLayout>
```

---

❌ **DON'T**: Use absolute positioning on mobile
```jsx
<div className="absolute top-0 left-0">Bad on mobile</div>
```

✅ **DO**: Conditional positioning
```jsx
<div className="hidden md:absolute md:top-0 md:left-0">Better</div>
```

---

## Support & Questions

For questions about responsive design patterns:
1. Check this guide first
2. Look at existing responsive components
3. Test in browser DevTools before deploying

Happy responsive coding! 🚀
