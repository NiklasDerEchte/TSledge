declare module 'mongoose' {
  /**
   * Extend SchemaTypeOptions to include the custom filter property.
   * TypeScript will automatically merge this with the existing interface.
   */
  interface SchemaTypeOptions<T> {
    /**
     * If set to `true`, this field will be included in fluent pattern handler filtering.
     *
     * Fields with `filter: true` can be searched using:
     * - The general filter parameter: `?filter=searchTerm`
     * - Specific field name in query parameters: `?fieldName=searchTerm`
     *
     * @example
     * ```typescript
     * const schema = new Schema({
     *   username: { type: String, filter: true },
     *   email: { type: String, filter: true }
     * });
     * ```
     */
    filter?: boolean;
  }
}
