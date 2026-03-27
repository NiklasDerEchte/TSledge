[**tsledge**](../README.md)

***

# Interface: HTTPRequestConfig

Defined in: src/core/types.ts:68

## Properties

### body?

> `optional` **body?**: `any`

Defined in: src/core/types.ts:78

The body can be an object or a string. If it's an object, it will be automatically stringified as JSON and the Content-Type header will be set to application/json. If it's a string, it will be sent as-is and the Content-Type header will default to application/x-www-form-urlencoded unless explicitly set in the headers.

***

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: src/core/types.ts:82

Optional headers to include in the request. If the body is an object and Content-Type is not explicitly set, it will default to application/json. If the body is a string and Content-Type is not explicitly set, it will default to application/x-www-form-urlencoded. You can override these defaults by providing your own Content-Type header.

***

### method?

> `optional` **method?**: [`HttpMethod`](../enumerations/HttpMethod.md)

Defined in: src/core/types.ts:70

***

### url

> **url**: `string`

Defined in: src/core/types.ts:69

***

### urlSearchParams?

> `optional` **urlSearchParams?**: `Record`\<`string`, `string`\>

Defined in: src/core/types.ts:74

Optional query parameters to be appended to the URL. They will be automatically URL-encoded. For example, { search: 'test', page: '1' } will result in ?search=test&page=1 being appended to the URL.
