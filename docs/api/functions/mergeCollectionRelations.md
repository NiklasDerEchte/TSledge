[**tsledge**](../README.md)

***

# Function: mergeCollectionRelations()

> **mergeCollectionRelations**\<`T`\>(`model`, `relationsToMerge`, `match`, `compareFunc`, `validateFunc`): `Promise`\<`void`\>

Defined in: src/utils/mongo-relation.ts:49

Merges N:N relations by comparing existing relations with new ones,
removing obsolete relations and creating new ones.

## Type Parameters

### T

`T`

## Parameters

### model

`Model`\<`T`\>

Mongoose Model for the relation collection

### relationsToMerge

`any`[]

Array of relations to merge (can be null/undefined)

### match

`Record`\<`string`, `any`\>

MongoDB match query to find existing relations

### compareFunc

(`a`, `b`) => `boolean`

Function to compare two relations for equality

### validateFunc

(`relation`) => `any`

Function to validate and transform relation data

## Returns

`Promise`\<`void`\>
