import mongoose from 'mongoose';
import {
  Codec,
  CollectionResponse,
  QueryBuilderExecOptions,
  QueryBuilderOptions,
  JoinRelation,
  QueryBuilder,
} from './types';

export class MongoQueryBuilder implements QueryBuilder {
  private _options: QueryBuilderOptions;
  private _match: Record<string, any> = {};
  private _stages: any[] = [];
  private _relations: JoinRelation[] = [];
  private _unset: string[] = [];

  constructor(options: QueryBuilderOptions) {
    this._options = options;
    this._applyPathOptions();
    if (this._options.match && Object.keys(this._options.match).length) {
      this.match(this._options.match);
    }
    this.addStage(this._options.stages);
  }

  /**
   * Applies schema-based options such as joins and unset fields.
   */
  private _applyPathOptions() {
    this._generateSchemaJoins(this._options.model.schema);
    this._generateSchemaUnsetList(this._options);
  }

  /**
   * Adds match conditions to the query builder.
   * @param match
   * @param conjunction
   * @param append
   * @returns
   */
  match(
    match: Record<string, any> | Record<string, any>[],
    conjunction: string = 'and',
    append: boolean = true
  ) {
    if (!match || Object.keys(match).length === 0) return;
    if (!append) {
      this._match = match;
      return;
    }
    const key = `$${conjunction}`;
    if (!this._match[key]) this._match[key] = [];
    if (Array.isArray(match)) {
      this._match[key].push(...match);
    } else {
      this._match[key].push(match);
    }
  }

  /**
   * Adds aggregation stages to the query builder.
   * @param stages
   * @returns
   */
  addStage(stages: any[] | {} | any) {
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
  relation(rels: JoinRelation | JoinRelation[]): MongoQueryBuilder {
    if (!rels) return this;
    const list = Array.isArray(rels) ? rels : [rels];
    list.forEach((rel) => this._relations.push(rel));
    return this;
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
          const refModel = mongoose.model(refModelName);
          let alias = schematype.options?.alias ?? refModel.collection.name;
          this.join(new JoinRelation(fullPath, refModel, alias));
        } catch (err) {
          console.warn(
            `[QueryBuilder] Could not resolve ref model '${refModelName}' for path '${fullPath}'`
          );
        }
      }

      //TODO Das hier iwie implementieren, falls Arrays mit refs gebraucht werden
      // if (schematype instanceof mongoose.Schema.Types.Array && schematype.caster?.options?.ref) {
      //   const refModelName = schematype.caster.options.ref;
      //   try {
      //     const refModel = mongoose.model(refModelName);
      //     let alias = schematype.caster.options?.alias ?? refModel.collection.name;
      //     this.join(new JoinRelation(fullPath, refModel, alias));
      //   } catch (err) {
      //     console.warn(`[QueryBuilder] Could not resolve array ref model '${refModelName}' for path '${fullPath}'`);
      //   }
      // }

      // if (schematype instanceof mongoose.Schema.Types.Subdocument) { //TODO Testen ob Subdocuments auch so erkannt werden können
      //   joins.push(...this._generateSchemaJoins(model.schema, fullPath));
      // }
    });
  }

  /**
   * Generates the list of fields to unset based on schema select options.
   * @param options
   */
  private _generateSchemaUnsetList(options: QueryBuilderOptions) {
    this._unset = [];
    let unset = this._collectSelectFalse(options.model.schema, undefined, options.select);
    for (const relation of this._relations) {
      unset = unset.concat(
        this._collectSelectFalse(relation.ref.schema, relation.alias, options.select)
      );
    }
    this._unset = Array.from(new Set(unset));
  }

  /**
   * Collects paths from the schema where select is set to false.
   * @param schema
   * @param prefix
   * @returns
   */
  private _collectSelectFalse(
    schema: mongoose.Schema,
    prefix: string | undefined = undefined,
    select: string[] | undefined = undefined
  ): string[] {
    const unset: string[] = [];
    schema.eachPath((path: string, schematype: any) => {
      if (select && select.length > 0) {
        if (select.includes(path)) {
          return;
        }
      }
      if (schematype?.options?.select === false) {
        unset.push(prefix ? `${prefix}.${path}` : path); //TODO Testen ob die 'select' Option auch richtig Einfluss auf Join Pfade hat, da das Join Object manmal im end Object 'obj.prefix.path' und manchmal 'obj.prefix.[0].path' sein kann
      }
    });
    return unset;
  }

  /**
   * Generates the aggregation pipeline based on joins and stages.
   * @returns The aggregation pipeline array.
   */
  private _generatePipeline(): any[] {
    const pipeline: any[] = [];
    // Joins
    for (const rel of this._relations) {
      pipeline.push(this._calculateJoin(rel));
    }
    // Stages
    pipeline.push(...this._stages);
    // Match
    if (Object.keys(this._match).length) {
      pipeline.push({ $match: this._match });
    }
    if (this._unset.length) {
      pipeline.push({ $unset: this._unset });
    }
    return pipeline;
  }

  /**
   * Executes the aggregation pipeline and returns the results.
   * @returns The collection response wrapped in a Codec.
   */
  async exec<T = any>(execOptions: QueryBuilderExecOptions): Promise<Codec<CollectionResponse>> {
    try {
      let pipeline = this._generatePipeline();

      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'n' });

      const queryPipeline = [...pipeline];
      if (!execOptions.isOne) {
        if (execOptions.skip) queryPipeline.push({ $skip: execOptions.skip });
        if (execOptions.limit) queryPipeline.push({ $limit: execOptions.limit });
      }

      const [countRes, res] = await Promise.all([
        this._options.model.aggregate(countPipeline).exec(),
        this._options.model.aggregate<T>(queryPipeline).exec(),
      ]);

      const maxRows = countRes && countRes[0] ? countRes[0].n : 0;

      let documents;
      if (execOptions.isOne) {
        if (!res || res.length === 0) {
          documents = [];
        } else {
          let doc = this._options.model.hydrate(res[0]);
          if (this._options.eachFunc) {
            doc = this._options.eachFunc(doc as T);
          } else {
            if (this._options.asyncEachFunc) {
              doc = await this._options.asyncEachFunc(doc as T);
            }
          }
          documents = doc;
        }
      } else {
        let final = (res || []).map((doc: any) => this._options.model.hydrate(doc));
        if (this._options.eachFunc) {
          final = final.map(this._options.eachFunc);
        } else {
          if (this._options.asyncEachFunc) {
            const asyncFinal: any[] = [];
            for (const doc of final) {
              const newDoc = await this._options.asyncEachFunc(doc);
              asyncFinal.push(newDoc);
            }
            final = asyncFinal;
          }
        }
        documents = final;
      }
      return new Codec<CollectionResponse>({ data: documents, meta: { total: maxRows } }, 200);
    } catch (err) {
      console.error('[ERROR - QueryBuilder]', err);
      return new Codec<CollectionResponse>({ data: [], meta: { total: 0 } }, 500);
    }
  }
}
