# Property Image Picker

## Overview

The `PropertyImagePicker` component provides a unified interface for setting a property's photo via **file upload** or **AI image generation**. It encapsulates the `useUpload` and `useGenerateImage` hooks, toast notifications, and file validation so consuming pages don't need to duplicate that logic.

## Component

**File**: `client/src/features/property-images/PropertyImagePicker.tsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | required | Current image URL (empty string if none) |
| `onImageChange` | `(url: string) => void` | required | Called when image is set or removed |
| `propertyName` | `string` | optional | Used to auto-generate AI prompt |
| `location` | `string` | optional | Used to auto-generate AI prompt |
| `variant` | `"dark" \| "light"` | `"dark"` | Visual theme — `"dark"` for dialog contexts, `"light"` for assumption pages |

### Usage

```tsx
import { PropertyImagePicker } from "@/features/property-images";

// In a create dialog (dark variant is default)
<PropertyImagePicker
  imageUrl={formData.imageUrl}
  onImageChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
  propertyName={formData.name}
  location={formData.location}
/>

// In an edit page (light variant for assumption pages)
<PropertyImagePicker
  imageUrl={draft.imageUrl}
  onImageChange={(url) => handleChange("imageUrl", url)}
  propertyName={draft.name}
  location={draft.location}
  variant="light"
/>
```

## Hook: `useGenerateImage`

**File**: `client/src/features/property-images/useGenerateImage.ts`

Calls `POST /api/generate-property-image` which generates an image via OpenAI `gpt-image-1` and uploads it to object storage in one step.

### API

```typescript
const { generateImage, isGenerating, error } = useGenerateImage({
  onSuccess: (objectPath: string) => { /* objectPath like /objects/uploads/uuid */ },
  onError: (error: Error) => { /* handle error */ },
});

// Generate and get the path
const path = await generateImage("Luxury boutique hotel exterior, golden hour");
```

## Server Endpoint

**`POST /api/generate-property-image`** (auth required)

Request:
```json
{ "prompt": "Luxury boutique hotel exterior, Upstate New York" }
```

Response:
```json
{ "objectPath": "/objects/uploads/abc-123-uuid" }
```

The endpoint calls `generateImageBuffer()` from `server/replit_integrations/image/client.ts`, then uploads the resulting PNG buffer to object storage via presigned URL.

## Auto-Prompt Generation

When the user leaves the prompt field empty and clicks Generate, the component builds a prompt from the property name and location:

```
"Luxury boutique hotel exterior, [property name], [location], architectural photography, golden hour lighting"
```

If neither property name nor location is provided, the user must enter a prompt manually.

## Integration Points

| Page | File | Variant |
|------|------|---------|
| Portfolio (create dialog) | `client/src/pages/Portfolio.tsx` | `"dark"` (default) |
| Property Edit | `client/src/pages/PropertyEdit.tsx` | `"light"` |

## Modes

1. **Upload** — Click-to-upload dropzone with file validation (image types only, max 10MB). Uses `useUpload` hook with presigned URL flow.
2. **Generate** — Text prompt input with "Generate Photo" button. Calls `useGenerateImage` hook. Supports auto-prompt from property context.

Both modes show an image preview with a remove button once an image is set.
