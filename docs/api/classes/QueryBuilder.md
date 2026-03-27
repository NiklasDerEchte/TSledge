[**tsledge**](../README.md)

***

# Class: QueryBuilder

Defined in: src/core/query-builder.ts:4

## Constructors

### Constructor

> **new QueryBuilder**(`config`): `QueryBuilder`

Defined in: src/core/query-builder.ts:11

#### Parameters

##### config

[`QueryBuilderConfig`](../interfaces/QueryBuilderConfig.md)

#### Returns

`QueryBuilder`

## Methods

### exec()

> **exec**\<`T`\>(`config?`): [`PromiseDefaultCodec`](../type-aliases/PromiseDefaultCodec.md)

Defined in: src/core/query-builder.ts:226

Executes the aggregation pipeline and returns the results.

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### config?

Parameters for the query execution.

###### isOne?

`boolean`

###### limit?

`number`

###### skip?

`number`

#### Returns

[`PromiseDefaultCodec`](../type-aliases/PromiseDefaultCodec.md)

The collection response wrapped in a Codec.

***

### getAggregationPipeline()

> **getAggregationPipeline**(): `any`[]

Defined in: src/core/query-builder.ts:20

Generates the aggregation pipeline based on the current configuration of the QueryBuilder.

#### Returns

`any`[]

***

### getConfig()

> **getConfig**(): [`QueryBuilderConfig`](../interfaces/QueryBuilderConfig.md)

Defined in: src/core/query-builder.ts:28

Returns the current configuration of the QueryBuilder, including model, select fields, and any applied options.

#### Returns

[`QueryBuilderConfig`](../interfaces/QueryBuilderConfig.md)

***

### join()

> **join**(`rels`): `void`

Defined in: src/core/query-builder.ts:85

Adds join relations to the query builder.

#### Parameters

##### rels

[`JoinRelation`](JoinRelation.md)\<`any`\> \| [`JoinRelation`](JoinRelation.md)\<`any`\>[]

#### Returns

`void`

***

### match()

> **match**(`match`, `conjunction?`, `append?`): `void`

Defined in: src/core/query-builder.ts:46

Adds match conditions to the query builder.

#### Parameters

##### match

`Record`\<`string`, `any`\> \| `Record`\<`string`, `any`\>[]

The match conditions to add.

##### conjunction?

`string` = `'and'`

The logical conjunction ('and' or 'or').

##### append?

`boolean` = `true`

Whether to append to existing conditions or replace them.

#### Returns

`void`

***

### stage()

> **stage**(`stages`): `void`

Defined in: src/core/query-builder.ts:71

Adds aggregation stages to the query builder.

#### Parameters

##### stages

`any`

#### Returns

`void`
