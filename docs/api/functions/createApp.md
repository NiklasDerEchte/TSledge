[**tsledge**](../README.md)

***

# Function: createApp()

> **createApp**(): `Express`

Defined in: src/app.ts:17

Creates and configures an Express application.

## Returns

`Express`

The configured Express application.

## Example

```typescript
const app = tsledge.createApp();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```
