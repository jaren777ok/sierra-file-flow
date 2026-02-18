

## Plan: Fix Desynchronized Icons and Names in Area Upload Steps

### Root Cause

When navigating between area steps (Comercial -> Operaciones -> Pricing -> Administracion), React reuses the same `FileUploadStep` component instance because it renders the same component type at the same tree position. This causes stale rendering where the icon updates but the name stays from a previous area.

### Solution

Two changes, both in `src/components/MultiStepUploader.tsx`:

**1. Add `key={area.key}` to FileUploadStep**

This forces React to fully unmount and remount the component when switching between areas, eliminating any stale state or rendering artifacts.

```typescript
case 'comercial':
case 'operaciones':
case 'pricing':
case 'administracion': {
  const area = areas.find(a => a.key === currentStepKey);
  if (!area) return null;
  return (
    <FileUploadStep
      key={area.key}          // <-- ADD THIS
      area={area}
      files={areaFiles[area.key]}
      onFilesChange={(files) => updateAreaFiles(area.key, files)}
      onNext={nextStep}
      onPrev={prevStep}
      disabled={hasActiveJob()}
    />
  );
}
```

**2. Add `key` to CustomAreaUploadStep too (same issue)**

```typescript
if (currentStepKey.startsWith('custom_')) {
  // ...
  return (
    <CustomAreaUploadStep
      key={customArea.id}    // <-- ADD THIS
      area={customArea}
      // ...
    />
  );
}
```

### Why This Works

React uses component type + position in the tree to decide whether to reuse a component instance. When switching from "Comercial" to "Operaciones", both render `<FileUploadStep>` at the same tree position. Without a `key`, React reuses the instance and only updates props -- but this can cause stale DOM content. Adding `key={area.key}` tells React these are fundamentally different component instances, forcing a full unmount/remount.

### Files Modified

| File | Change |
|------|--------|
| `src/components/MultiStepUploader.tsx` | Add `key` prop to `FileUploadStep` and `CustomAreaUploadStep` |

### Impact

- Zero risk -- only adds a React key prop
- No logic changes, no database changes
- Fixes the issue universally for all users and browsers

