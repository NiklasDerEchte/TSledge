import mongoose from 'mongoose';
import {
  FluentRequestQuery,
  FluentAPIOption,
  fluentRequestQueryAttributes,
  FluentMiddleware,
  FluentExecParams,
} from './types';
import { Codec, DefaultResponseBody, PromiseDefaultCodec, QueryBuilder } from '../core/index';

interface FluentPatternParameter {
  id: string;
  ids: string[];
  excluded: string[];
  filterFields: Record<string, string>;
  filter: string;
  limit: string;
  offset: string;
}

export class FluentPatternHandler {
  private static _singleton: FluentPatternHandler;
  private _options: FluentAPIOption[];
  private _execMiddlewareFunctions: FluentMiddleware[] = [];

  /**
   * Constructor for QueryPatternExecutor.
   * @param options - Array of query pattern options for filtering.
   */
  constructor(options: FluentAPIOption[] = [], execMiddleware: FluentMiddleware[] = []) {
    if (FluentPatternHandler._singleton) {
      throw new Error(
        'FluentPatternHandler is a singleton class. Use FluentPatternHandler.getInstance() to access the instance.'
      );
    }
    this._options = options;
    this._execMiddlewareFunctions = execMiddleware;
    FluentPatternHandler._singleton = this;
  }

  /**
   * Initializes the singleton instance of FluentPatternHandler with the provided options.
   * @param options - Array of query pattern options for filtering.
   * @returns Singleton instance of FluentPatternHandler.
   */
  public static init(
    options: FluentAPIOption[] = [],
    execMiddleware: FluentMiddleware[] = []
  ): FluentPatternHandler {
    if (FluentPatternHandler._singleton != undefined) {
      throw new Error('FluentPatternHandler is already initialized');
    }
    FluentPatternHandler._singleton = new FluentPatternHandler(options, execMiddleware);
    return FluentPatternHandler._singleton;
  }

  /**
   * Returns the singleton instance of FluentPatternHandler.
   * @returns Singleton instance of FluentPatternHandler.
   */
  public static getInstance(): FluentPatternHandler {
    if (FluentPatternHandler._singleton == undefined) {
      throw new Error(
        'FluentPatternHandler instance has not been created yet. Please create an instance before calling getInstance().'
      );
    }
    return FluentPatternHandler._singleton;
  }

  /**
   * Parses and validates query parameters from the request.
   * @param query - The query object from the request.
   * @returns Parsed query parameters.
   */
  private _parseFluentRequestQuery(query: FluentRequestQuery): FluentPatternParameter {
    const { filter, limit = '5', offset = '0', id, excluded: excludedJSON, ids: idsJSON } = query;

    const queryKeys = Object.keys(fluentRequestQueryAttributes);
    let filterFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(query as Record<string, any>)) {
      if (queryKeys.includes(key)) continue;
      if (value == undefined) continue;
      try {
        filterFields[key] = typeof value === 'string' ? value : JSON.stringify(value);
      } catch (e) {
        filterFields[key] = String(value);
      }
    }

    let excluded: string[] | undefined;
    if (excludedJSON) {
      try {
        excluded = JSON.parse(excludedJSON);
        if (!Array.isArray(excluded)) throw new Error('Excluded must be an array');
      } catch (error) {
        console.warn('[QueryPatternExecutor] Invalid excluded parameter:', error);
      }
    }

    let ids: string[] | undefined;
    if (idsJSON) {
      try {
        ids = JSON.parse(idsJSON);
        if (!Array.isArray(ids)) throw new Error('Ids must be an array');
      } catch (error) {
        console.warn('[QueryPatternExecutor] Invalid ids parameter:', error);
      }
    }

    return { filter, limit, offset, id, excluded, ids, filterFields } as FluentPatternParameter;
  }

  /**
   * Applies filters to the query builder based on parsed parameters and options.
   * @param queryBuilder - The QueryBuilder instance.
   * @param params - Parsed query parameters.
   * @param config - Query request configuration.
   */
  private _applyParameters(queryBuilder: QueryBuilder, params: FluentPatternParameter): void {
    const { id, ids, filter, excluded } = params;

    if (id) {
      queryBuilder.match({ _id: new mongoose.Types.ObjectId(id) });
    } else if (ids && ids.length > 0) {
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
      queryBuilder.match({ _id: { $in: objectIds } });
    } else {
      // get allowed filter fields
      const modelFilterFields = this._getFilterFieldsForModel(queryBuilder.getConfig().model);
      // possible fields filtered by parameter "?filter="
      if (filter && modelFilterFields.length > 0) {
        const ors = modelFilterFields.map((field) => ({
          [field]: { $regex: filter, $options: 'i' },
        }));
        queryBuilder.match({ $or: ors });
      }
      // custom filter, but only for allowed fields specified via query parameters (e.g. '?username=')
      if (params.filterFields && Object.keys(params.filterFields).length > 0) {
        for (const [field, value] of Object.entries(params.filterFields)) {
          if (!modelFilterFields.includes(field)) {
            continue;
          }
          const match: Record<string, any> = {};
          match[field] = { $regex: value, $options: 'i' };
          queryBuilder.match(match);
        }
      }
      if (excluded && excluded.length > 0) {
        const objectIds = excluded.map((id) => new mongoose.Types.ObjectId(id));
        queryBuilder.match({ _id: { $nin: objectIds } });
      }
    }
  }

  /**
   * Retrieves filter fields for the given model from the options configuration.
   * @param model - The Mongoose model.
   * @returns Array of filter fields.
   */
  private _getFilterFieldsForModel(model: mongoose.Model<any>): string[] {
    for (const option of this._options) {
      if (option.model.collection.name === model.collection.name) {
        if (option.filters) {
          return option.filters;
        }
        return [];
      }
    }
    return [];
  }

  /**
   * Builds execution parameters for the query builder.
   * @param params - Parsed query parameters.
   * @returns Execution parameters.
   */
  private _buildExecutionConfig(params: FluentPatternParameter): {
    isOne: boolean;
    limit?: number;
    skip?: number;
  } {
    const { id, limit, offset } = params;
    return {
      isOne: Boolean(id),
      limit: limit === 'full' ? undefined : parseInt(limit || '5', 10),
      skip: parseInt(offset || '0', 10),
    };
  }

/**
 * Executes the query builder with applied filters and returns the result.
 * @param params Execution parameters including the query builder and request query.
 * @returns 
 */
  public async exec<T = any>(params: FluentExecParams): PromiseDefaultCodec {
    try {
      if (this._execMiddlewareFunctions && this._execMiddlewareFunctions.length > 0) {
        this._execMiddlewareFunctions.forEach((func: FluentMiddleware) => {
          func(params);
        });
      }
      const queryParams = this._parseFluentRequestQuery(params.req.query as FluentRequestQuery);
      this._applyParameters(params.queryBuilder, queryParams);
      const execConfig = this._buildExecutionConfig(queryParams);
      return await params.queryBuilder.exec(execConfig);
    } catch (err) {
      console.error('[ERROR - QueryPatternExecutor]', err);
      return new Codec<DefaultResponseBody>({ data: [], meta: { total: 0 } }, 500);
    }
  }
}
