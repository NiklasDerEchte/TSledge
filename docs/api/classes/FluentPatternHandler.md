[**tsledge**](../README.md)

***

# Class: FluentPatternHandler

Defined in: src/fluent-interface/fluent-pattern-handler.ts:20

## Constructors

### Constructor

> **new FluentPatternHandler**(`execMiddleware?`): `FluentPatternHandler`

Defined in: src/fluent-interface/fluent-pattern-handler.ts:34

Constructor for FluentPatternHandler.

#### Parameters

##### execMiddleware?

[`FluentMiddleware`](../type-aliases/FluentMiddleware.md)[] = `[]`

Optional array of middleware functions to be executed before the main query execution in the exec method.

#### Returns

`FluentPatternHandler`

## Methods

### exec()

> **exec**\<`T`\>(`params`): [`PromiseDefaultCodec`](../type-aliases/PromiseDefaultCodec.md)

Defined in: src/fluent-interface/fluent-pattern-handler.ts:194

Executes the query builder with applied filters and returns the result.

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### params

[`FluentExecParams`](../type-aliases/FluentExecParams.md)

Execution parameters including the query builder and request query.

#### Returns

[`PromiseDefaultCodec`](../type-aliases/PromiseDefaultCodec.md)

***

### getInstance()

> `static` **getInstance**(): `FluentPatternHandler`

Defined in: src/fluent-interface/fluent-pattern-handler.ts:61

Returns the singleton instance of FluentPatternHandler.

#### Returns

`FluentPatternHandler`

Singleton instance of FluentPatternHandler.

***

### init()

> `static` **init**(`execMiddleware?`): `FluentPatternHandler`

Defined in: src/fluent-interface/fluent-pattern-handler.ts:49

Initializes the singleton instance of FluentPatternHandler with the provided options.

#### Parameters

##### execMiddleware?

[`FluentMiddleware`](../type-aliases/FluentMiddleware.md)[] = `[]`

Optional array of middleware functions to be executed before the main query execution in the exec method.

#### Returns

`FluentPatternHandler`

Singleton instance of FluentPatternHandler.
