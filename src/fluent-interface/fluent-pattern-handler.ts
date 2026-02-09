import mongoose from 'mongoose';
import {
  FluentRequestQuery,
  FluentAPIPath,
  FluentExpressRequest,
  fluentRequestQueryAttributes,
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
  private _paths: FluentAPIPath[];

  /**
   * Constructor for QueryPatternExecutor.
   * @param paths - Array of query pattern paths for filtering.
   */
  constructor(paths: FluentAPIPath[] = []) {
    if (FluentPatternHandler._singleton) {
      throw new Error(
        'FluentPatternHandler is a singleton class. Use FluentPatternHandler.getInstance() to access the instance.'
      );
    }
    this._paths = paths;
    FluentPatternHandler._singleton = this;
  }

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
   * Retrieves filter fields for the given model from the paths configuration.
   * @param model - The Mongoose model.
   * @returns Array of filter fields.
   */
  private _getFilterFieldsForModel(model: mongoose.Model<any>): string[] {
    for (const path of this._paths) {
      if (path.model.collection.name === model.collection.name) {
        if (path.filters) {
          return path.filters;
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
   * Executes the query builder with the applied filters and execution parameters.
   * @param req
   * @param queryBuilder
   * @returns
   */
  public async exec<T = any>(
    req: FluentExpressRequest,
    queryBuilder: QueryBuilder
  ): PromiseDefaultCodec {
    try {
      const queryParams = this._parseFluentRequestQuery(req.query as FluentRequestQuery);
      this._applyParameters(queryBuilder, queryParams);
      const execConfig = this._buildExecutionConfig(queryParams);
      return await queryBuilder.exec(execConfig);
    } catch (err) {
      console.error('[ERROR - QueryPatternExecutor]', err);
      return new Codec<DefaultResponseBody>({ data: [], meta: { total: 0 } }, 500);
    }
  }
}
