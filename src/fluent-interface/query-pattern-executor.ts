import mongoose from 'mongoose';
import {
  FluentResponse,
  FluentQuery,
  FilterFields,
  Codec,
  QueryRequestConfig,
  QueryPatternPath
} from './types';
import { QueryBuilder } from './query-builder';

export class QueryPatternExecutor {
  private _paths: QueryPatternPath[];

  /**
   * Constructor for QueryPatternExecutor.
   * @param paths - Array of query pattern paths for filtering.
   */
  constructor(paths: QueryPatternPath[]) {
    this._paths = paths;
  }

  /**
   * Parses and validates query parameters from the request.
   * @param query - The query object from the request.
   * @returns Parsed query parameters.
   */
  private _parseQueryParameters(query: FluentQuery): {
    filter?: string;
    limit?: string;
    offset?: string;
    id?: string;
    excluded?: string[];
    ids?: string[];
  } {
    const {
      filter,
      limit = '5',
      offset = '0',
      id,
      excluded: excludedJSON,
      ids: idsJSON,
    } = query;

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
   * @param options - Query request configuration.
   */
  private _applyFilters(
    queryBuilder: QueryBuilder,
    params: ReturnType<QueryPatternExecutor['_parseQueryParameters']>,
    options: QueryRequestConfig
  ): void {
    const { id, ids, filter, excluded } = params;

    if (id) {
      queryBuilder.match({ _id: new mongoose.Types.ObjectId(id) });
    } else if (ids && ids.length > 0) {
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
      queryBuilder.match({ _id: { $in: objectIds } });
    } else {
      // Apply general filters
      const filterFields = this._getFilterFieldsForModel(options.model);
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
  private _buildExecutionParameters(params: ReturnType<QueryPatternExecutor['_parseQueryParameters']>): {
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
   * Executes the fluent query based on the provided options.
   * @param options - Configuration for the query request.
   * @returns Promise resolving to a Codec containing the response.
   */
  public async exec<T = any>(options: QueryRequestConfig): Promise<Codec<FluentResponse>> {
    try {
      const queryParams = this._parseQueryParameters(options.req.query as FluentQuery);
      const queryBuilder = new QueryBuilder(options);

      this._applyFilters(queryBuilder, queryParams, options);

      const execParams = this._buildExecutionParameters(queryParams);
      return await queryBuilder.exec(execParams);
    } catch (err) {
      console.error('[ERROR - QueryPatternExecutor]', err);
      return new Codec<FluentResponse>({ data: [], meta: { total: 0 } }, 500);
    }
  }
}
