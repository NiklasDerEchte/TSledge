[**tsledge**](../README.md)

***

# Class: Codec\<T\>

Defined in: src/core/types.ts:9

## Type Parameters

### T

`T` = `any`

## Constructors

### Constructor

> **new Codec**\<`T`\>(`content`, `code?`): `Codec`\<`T`\>

Defined in: src/core/types.ts:13

#### Parameters

##### content

`T`

##### code?

`number` = `202`

#### Returns

`Codec`\<`T`\>

## Properties

### content

> **content**: `T`

Defined in: src/core/types.ts:10

***

### returnCode

> **returnCode**: `number`

Defined in: src/core/types.ts:11

## Methods

### is1xx()

> **is1xx**(): `boolean`

Defined in: src/core/types.ts:25

#### Returns

`boolean`

***

### is2xx()

> **is2xx**(): `boolean`

Defined in: src/core/types.ts:28

#### Returns

`boolean`

***

### is3xx()

> **is3xx**(): `boolean`

Defined in: src/core/types.ts:31

#### Returns

`boolean`

***

### is4xx()

> **is4xx**(): `boolean`

Defined in: src/core/types.ts:34

#### Returns

`boolean`

***

### sendToClient()

> **sendToClient**(`res`): `void`

Defined in: src/core/types.ts:18

#### Parameters

##### res

`any`

#### Returns

`void`
