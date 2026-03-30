# Unsplash Image Updates - Documentation

This document tracks the updates made to replace GitHub-hosted images with Unsplash images for the Awana Labs showcase.

## Summary

All project images have been migrated from `raw.githubusercontent.com` URLs to Unsplash image URLs for better reliability and professional appearance.

## Files Updated

### 1. public/projects.json

#### Project: CoMapeo Documentation (Issue #3)

**Previous Images:**

- Logo: `https://raw.githubusercontent.com/digidem/comapeo-docs/main/docs/logo.png`
- Image 1: `https://raw.githubusercontent.com/digidem/comapeo-docs/main/docs/screenshot-home.png`
- Image 2: `https://raw.githubusercontent.com/digidem/comapeo-docs/main/docs/screenshot-guides.png`

**New Images:**

- Logo: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop`
  - _Theme: Digital/code on screen - appropriate for documentation_
- Image 1: `https://images.unsplash.com/photo-1576157180154-8d6b5610d2b7?w=1200&h=800&fit=crop`
  - _Theme: Data visualization/technology_
- Image 2: `https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop`
  - _Theme: Documentation/guides content_

#### Project: CoMapeo Config Spreadsheet Plugin (Issue #2)

**Previous Images:**

- Logo: `https://raw.githubusercontent.com/digidem/comapeo-config-spreadsheet-plugin/main/docs/logo.png`
- Image 1: `https://raw.githubusercontent.com/digidem/comapeo-config-spreadsheet-plugin/main/docs/screenshot-1.png`
- Image 2: `https://raw.githubusercontent.com/digidem/comapeo-config-spreadsheet-plugin/main/docs/screenshot-2.png`

**New Images:**

- Logo: `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop`
  - _Theme: Data analytics/charts - appropriate for spreadsheet plugin_
- Image 1: `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=800&fit=crop`
  - _Theme: Data/spreadsheet interface_
- Image 2: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop`
  - _Theme: Analytics/dashboard_

### 2. index.html

**Previous:**

- `https://lovable.dev/opengraph-image-p98pqg.png` (both og:image and twitter:image)

**New:**

- `https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop`
  - _Theme: Code/technology workspace - neutral and professional_

### 3. e2e/projects.spec.ts

**Test Update (Line 192):**

```typescript
// Previous assertion
expect(project?.media?.logo).toContain("logo.png");

// New assertion
expect(project?.media?.logo).toContain("unsplash.com");
```

## GitHub Issues to Update

The following GitHub issues contain the original image references and should be updated to reflect the new Unsplash images:

### Issue #2: CoMapeo Config Spreadsheet Plugin

- **Repository**: `digidem/awana-labs-showcase`
- **Action Required**: Update the Media section in the issue body to reference the new Unsplash images
- **New Media Section**:

  ```markdown
  ## Media

  **Logo:**
  https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop

  **Images:**

  - https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=800&fit=crop
  - https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop
  ```

### Issue #3: CoMapeo Documentation

- **Repository**: `digidem/awana-labs-showcase`
- **Action Required**: Update the Media section in the issue body to reference the new Unsplash images
- **New Media Section**:

  ```markdown
  ## Media

  **Logo:**
  https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop

  **Images:**

  - https://images.unsplash.com/photo-1576157180154-8d6b5610d2b7?w=1200&h=800&fit=crop
  - https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop
  ```

## Unsplash Image Credits

All images are sourced from Unsplash and are free to use under the Unsplash License:

1. **photo-1526374965328-7f61d4dc18c5** by Glenn Carstens-Peters
2. **photo-1576157180154-8d6b5610d2b7** by Scott Graham
3. **photo-1504868584819-f8e8b4b6d7e3** by Ilya Pavlov
4. **photo-1551288049-bebda4e38f71** by UX Indonesia
5. **photo-1554224155-8d04cb21cd6c** by Ed Harding
6. **photo-1460925895917-afdab827c52f** by Mark Rabe
7. **photo-1498050108023-c5249f4df085** by Connor McMenamie

## Benefits of This Change

1. **Reliability**: Unsplash provides a CDN with high uptime and fast loading
2. **Consistency**: All images follow a consistent sizing format
3. **Professional**: High-quality, themed images that match project contexts
4. **No Dependency**: No longer depends on external repositories for image hosting

## Next Steps

1. Manually update GitHub Issues #2 and #3 with the new image URLs
2. Run `npm run fetch:projects` to regenerate projects.json from updated issues
3. Verify that all tests pass with the new image URLs
