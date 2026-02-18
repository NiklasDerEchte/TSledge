import mongoose from 'mongoose';
import { Codec, DefaultResponseBody, JoinRelation, PromiseDefaultCodec, QueryBuilderConfig } from './types';

export class QueryBuilder {
  private _config: QueryBuilderConfig;
  private _matchConditions: Record<string, any> = {};
  private _stages: any[] = [];
  private _relations: JoinRelation[] = [];
  private _unsetFields: string[] = [];

  constructor(config: QueryBuilderConfig) {
    this._config = config;
    this._applyPathOptions();
  }

  /**
   * Generates the aggregation pipeline based on the current configuration of the QueryBuilder.
   * @returns
   */
  public getAggregationPipeline(): any[] {
    return this._generatePipeline();
  }

  /**
   * Returns the current configuration of the QueryBuilder, including model, select fields, and any applied options.
   * @returns
   */
  public getConfig(): QueryBuilderConfig {
    return this._config;
  }

  /**
   * Applies schema-based options such as joins and unset fields.
   */
  private _applyPathOptions() {
    this._generateSchemaJoins(this._config.model.schema);
    this._generateSchemaUnsetList(this._config);
  }

  /**
   * Adds match conditions to the query builder.
   * @param match - The match conditions to add.
   * @param conjunction - The logical conjunction ('and' or 'or').
   * @param append - Whether to append to existing conditions or replace them.
   */
  match(
    match: Record<string, any> | Record<string, any>[],
    conjunction: string = 'and',
    append: boolean = true
  ) {
    if (!match || (Array.isArray(match) ? match.length === 0 : Object.keys(match).length === 0))
      return;
    if (!append) {
      this._matchConditions = Array.isArray(match) ? { $and: match } : match;
      return;
    }
    const key = `$${conjunction}`;
    if (!this._matchConditions[key]) this._matchConditions[key] = [];
    if (Array.isArray(match)) {
      this._matchConditions[key].push(...match);
    } else {
      this._matchConditions[key].push(match);
    }
  }

  /**
   * Adds aggregation stages to the query builder.
   * @param stages
   * @returns
   */
  stage(stages: any[] | {} | any) {
    if (!stages) return;
    if (Array.isArray(stages)) {
      this._stages.push(...globalThis.structuredClone(stages));
    } else {
      this._stages.push(globalThis.structuredClone(stages));
    }
  }

  /**
   * Adds join relations to the query builder.
   * @param rels
   * @returns
   */
  join(rels: JoinRelation | JoinRelation[] | null) {
    if (!rels) return;
    const list = Array.isArray(rels) ? rels : [rels];
    list.forEach((rel) => this._relations.push(rel));
  }

  /**
   * Calculates the $lookup stage for a given JoinRelation.
   * @param relation
   * @returns
   */
  private _calculateJoin(relation: JoinRelation) {
    if (!(relation instanceof JoinRelation)) throw new Error('relation must be JoinRelation');
    return {
      $lookup: {
        from: relation.ref.collection.name,
        localField: relation.localField,
        foreignField: '_id',
        as: relation.alias,
      },
    };
  }

  /**
   * Automatically generates JoinRelation objects from schema refs.
   * @param model The Mongoose model to scan.
   * @param prefix Optional prefix for nested paths (e.g., 'alias.field').
   * @returns Array of JoinRelation objects.
   */
  private _generateSchemaJoins(schema: mongoose.Schema, prefix: string = '') {
    schema.eachPath((path: string, schematype: any) => {
      const fullPath = prefix ? `${prefix}.${path}` : path;

      if (schematype.options?.ref) {
        const refModelName = schematype.options.ref;
        try {
          console.log("Generate Schema");
          console.log(`[QueryBuilder] Resolving ref model '${refModelName}' for path '${fullPath}'`);
          const refModel = mongoose.model(refModelName);
          console.log(Object.keys(mongoose.models));
          console.log(`[QueryBuilder] RefModel '${refModel.modelName}' resolved for path '${fullPath}'`);
          let alias = schematype.options?.alias ?? refModel.collection.name;
          console.log(`[QueryBuilder] Using alias '${alias}' for path '${fullPath}'`);
          this.join(new JoinRelation(fullPath, refModel, alias));
        } catch (err) {
          console.warn(
            `[QueryBuilder] Could not resolve ref model '${refModelName}' for path '${fullPath}'`
          );
        }
      }

      if (
        schematype instanceof mongoose.Schema.Types.Array &&
        (schematype as any).caster?.options?.ref
      ) {
        const refModelName = (schematype as any).caster.options.ref;
        try {
          const refModel = mongoose.model(refModelName);
          let alias = (schematype as any).caster.options?.alias ?? refModel.collection.name;
          this.join(new JoinRelation(fullPath, refModel, alias));
        } catch (err) {
          console.warn(
            `[QueryBuilder] Could not resolve array ref model '${refModelName}' for path '${fullPath}'`
          );
        }
      }

      // if (schematype instanceof mongoose.Schema.Types.Subdocument) { //TODO Testen ob Subdocuments auch so erkannt werden können
      //   joins.push(...this._generateSchemaJoins(model.schema, fullPath));
      // }
    });
  }

  /**
   * Generates the list of fields to unset based on schema select options.
   * @param config - The query request configuration.
   */
  private _generateSchemaUnsetList(config: QueryBuilderConfig) {
    this._unsetFields = [];
    let unset = this._collectSelectFalse(config.model.schema, undefined, config.select);
    for (const relation of this._relations) {
      unset = unset.concat(
        this._collectSelectFalse(relation.ref.schema, relation.alias, config.select)
      );
    }
    this._unsetFields = Array.from(new Set(unset));
  }

  /**
   * Collects paths from the schema where select is set to false.
   * @param schema - The Mongoose schema to scan.
   * @param prefix - Optional prefix for nested paths.
   * @param select - Optional array of fields to select.
   * @returns Array of paths to unset.
   */
  private _collectSelectFalse(
    schema: mongoose.Schema,
    prefix: string | undefined = undefined,
    select: string[] | undefined = undefined
  ): string[] {
    const unset: string[] = [];
    schema.eachPath((path: string, schematype: any) => {
      // If select is specified, only consider fields not in select or with select: false
      if (
        select &&
        select.length > 0 &&
        !select.includes(path) &&
        schematype?.options?.select !== false
      ) {
        return;
      }
      if (schematype?.options?.select === false) {
        unset.push(prefix ? `${prefix}.${path}` : path);
      }
    });
    return unset;
  }

  /**
   * Generates the aggregation pipeline based on joins, stages, match conditions, and unset fields.
   * @returns The aggregation pipeline array.
   */
  private _generatePipeline(): any[] {
    const pipeline: any[] = [];
    // Add join stages
    for (const rel of this._relations) {
      pipeline.push(this._calculateJoin(rel));
    }
    // Add custom stages
    pipeline.push(...this._stages);
    // Add match conditions
    if (Object.keys(this._matchConditions).length) {
      pipeline.push({ $match: this._matchConditions });
    }
    // Add unset fields
    if (this._unsetFields.length) {
      pipeline.push({ $unset: this._unsetFields });
    }
    return pipeline;
  }

  /**
   * Executes the aggregation pipeline and returns the results.
   * @param config - Parameters for the query execution.
   * @returns The collection response wrapped in a Codec.
   */
  async exec<T = any>(config?: {
    isOne?: boolean;
    limit?: number;
    skip?: number;
  }): PromiseDefaultCodec {
    try {
      const pipeline = this._generatePipeline();

      const countPipeline = [...pipeline, { $count: 'n' }];
      const queryPipeline = [...pipeline];
      if (config && !config.isOne) {
        if (config.skip) queryPipeline.push({ $skip: config.skip });
        if (config.limit) queryPipeline.push({ $limit: config.limit });
      }

      const [countRes, res] = await Promise.all([
        this._config.model.aggregate(countPipeline).exec(),
        this._config.model.aggregate<T>(queryPipeline).exec(),
      ]);

      const totalCount = countRes && countRes[0] ? countRes[0].n : 0;
      const documents =
        config && config.isOne
          ? await this._processSingleDocument<T>(res)
          : await this._processMultipleDocuments<T>(res);

      return new Codec<DefaultResponseBody>({ data: documents, meta: { total: totalCount } }, 200);
    } catch (err) {
      console.error('[ERROR - QueryBuilder]', err);
      return new Codec<DefaultResponseBody>({ data: [], meta: { total: 0 } }, 500);
    }
  }

  /**
   * Processes a single document from the aggregation result.
   * @param res - The aggregation result array.
   * @returns The processed document or null if none.
   */
  private async _processSingleDocument<T>(res: any[]): Promise<T | null> {
    if (!res || res.length === 0) {
      return null;
    }
    let doc = this._config.model.hydrate(res[0]);
    if (this._config.eachFunc) {
      doc = this._config.eachFunc(doc as T);
    } else if (this._config.asyncEachFunc) {
      doc = await this._config.asyncEachFunc(doc as T);
    }
    return doc;
  }

  /**
   * Processes multiple documents from the aggregation result.
   * @param res - The aggregation result array.
   * @returns The array of processed documents.
   */
  private async _processMultipleDocuments<T>(res: any[]): Promise<T[]> {
    let final = (res || []).map((doc: any) => this._config.model.hydrate(doc));
    if (this._config.eachFunc) {
      final = final.map(this._config.eachFunc);
    } else if (this._config.asyncEachFunc) {
      const asyncFinal: T[] = [];
      for (const doc of final) {
        const newDoc = await this._config.asyncEachFunc(doc);
        asyncFinal.push(newDoc);
      }
      final = asyncFinal;
    }
    return final;
  }
}
