import mongoose from 'mongoose';
import {
  FluentResponseBody,
  FluentRequestQuery,
  FilterFields,
  Codec,
  FluentExecuteConfig,
  FluentAPIPath,
} from './types';
import { QueryBuilder } from './query-builder';

export class FluentPatternExecutor {
  private static _singleton: FluentPatternExecutor;
  private _paths: FluentAPIPath[];

  /**
   * Constructor for QueryPatternExecutor.
   * @param paths - Array of query pattern paths for filtering.
   */
  constructor(paths: FluentAPIPath[] = []) {
    if (FluentPatternExecutor._singleton) {
      throw new Error(
        'FluentPatternExecutor is a singleton class. Use FluentPatternExecutor.getInstance() to access the instance.'
      );
    }
    this._paths = paths;
    FluentPatternExecutor._singleton = this;
  }

  public static getInstance(): FluentPatternExecutor {
    if (FluentPatternExecutor._singleton == undefined) {
      throw new Error('FluentPatternExecutor instance has not been created yet. Please create an instance before calling getInstance().');
    } 
    return FluentPatternExecutor._singleton;
  }

  /**
   * Parses and validates query parameters from the request.
   * @param query - The query object from the request.
   * @returns Parsed query parameters.
   */
  private _parseFluentRequestQuery(query: FluentRequestQuery): {
    filter?: string;
    limit?: string;
    offset?: string;
    id?: string;
    excluded?: string[];
    ids?: string[];
  } {
    const { filter, limit = '5', offset = '0', id, excluded: excludedJSON, ids: idsJSON } = query;

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

    return { filter, limit, offset, id, excluded, ids };
  }

  /**
   * Applies filters to the query builder based on parsed parameters and options.
   * @param queryBuilder - The QueryBuilder instance.
   * @param params - Parsed query parameters.
   * @param config - Query request configuration.
   */
  private _applyFilters(
    queryBuilder: QueryBuilder,
    params: ReturnType<FluentPatternExecutor['_parseFluentRequestQuery']>,
    config: FluentExecuteConfig
  ): void {
    const { id, ids, filter, excluded } = params;

    if (id) {
      queryBuilder.match({ _id: new mongoose.Types.ObjectId(id) });
    } else if (ids && ids.length > 0) {
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
      queryBuilder.match({ _id: { $in: objectIds } });
    } else {
      // Apply general filters
      const filterFields = this._getFilterFieldsForModel(config.model);
      if (filter && filterFields.length > 0) {
        const ors = filterFields.map((field) => ({
          [field]: { $regex: filter, $options: 'i' },
        }));
        queryBuilder.match({ $or: ors });
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
  private _getFilterFieldsForModel(model: mongoose.Model<any>): FilterFields {
    for (const path of this._paths) {
      if (path.model.collection.name === model.collection.name) {
        // Assuming filters are defined in the path; adjust as needed
        return path.filters ? Object.keys(path.filters) : [];
      }
    }
    return [];
  }

  /**
   * Builds execution parameters for the query builder.
   * @param params - Parsed query parameters.
   * @returns Execution parameters.
   */
  private _buildExecutionConfig(
    params: ReturnType<FluentPatternExecutor['_parseFluentRequestQuery']>
  ): {
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
   * Executes the fluent query based on the provided configs.
   * @param config - Configuration for the query request.
   * @returns Promise resolving to a Codec containing the response.
   */
  public async exec<T = any>(config: FluentExecuteConfig): Promise<Codec<FluentResponseBody>> {
    try {
      const queryParams = this._parseFluentRequestQuery(config.req.query as FluentRequestQuery);
      const queryBuilder = new QueryBuilder(config);

      this._applyFilters(queryBuilder, queryParams, config);
      const execConfig = this._buildExecutionConfig(queryParams);
      return await queryBuilder.exec(execConfig);
    } catch (err) {
      console.error('[ERROR - QueryPatternExecutor]', err);
      return new Codec<FluentResponseBody>({ data: [], meta: { total: 0 } }, 500);
    }
  }
}
