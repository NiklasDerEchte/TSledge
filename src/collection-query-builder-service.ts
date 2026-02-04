import mongoose from 'mongoose';
import {
  CollectionResponse,
  CollectionQuery,
  CollectionBody,
  CollectionParams,
  GetCollectionQueryOptions,
  FilterFields,
  Codec,
  CollectionOption
} from './types';
import { QueryBuilder } from './query-builder';
import { isNonEmptyObjectOrArray } from './utils';

export class GetCollectionQueryBuilder {
  private _queryBuilder: QueryBuilder;
  private _options: GetCollectionQueryOptions;

  /**
   * Constructor for GetCollectionQueryBuilder.
   */
  constructor(options: GetCollectionQueryOptions) {
    this._options = options;
    this._queryBuilder = new QueryBuilder({
      model: options.model,
      eachFunc: options.eachFunc,
      asyncEachFunc: options.asyncEachFunc,
      select: options.select,
      stages: isNonEmptyObjectOrArray(options.stages) ? options.stages : [],
      match: isNonEmptyObjectOrArray(options.match) ? options.match : {},
      relations: options.relations,
    });
  }

  /**
   * Static method to execute a collection query with given options.
   * @param options
   * @returns
   */
  // TODO
  // public static async exec(options: GetCollectionQueryOptions): Promise<Codec<CollectionResponse>> {
  //   let gcqb = new GetCollectionQueryBuilder(options);
  //   return await gcqb.executeCollectionQuery();
  // }

  /**
   * Adds a filter to exclude documents marked as end-of-life (EOL).
   */
  private addEolFilter() {
    // TODO Hier eine dynamische alternative finden um abzuprüfen
    // TODO Testen!! Wo ist der Filter nach dem CollectioName in der EolCollectionQueue?
    // this._queryBuilder.addStage([
    //   {
    //     $lookup: {
    //       from: EolCollectionQueue.collection.name,
    //       localField: '_id',
    //       foreignField: 'ofCollection',
    //       as: 'eolFlags',
    //     },
    //   },
    // ]);
    // this._queryBuilder.match({
    //   eolFlags: { $lte: [{ $size: '$eolFlags' }, 0] },
    // });
  }

  /**
   * Executes the collection query based on the provided options.
   * @param options
   * @returns
   */
  async executeCollectionQuery<T = any>(collectionOptions: CollectionOption): Promise<Codec<CollectionResponse>> {
    let {
      filter = undefined,
      limit = '5',
      offset = '0',
      id = undefined,
      excluded: excludedJSON = undefined,
      ids: idsJSON = undefined,
    } = (this._options.req.query as CollectionQuery) || {};
    let body = (this._options.req.body as CollectionBody) || {};
    const params = this._options.req.params as CollectionParams;

    let excluded = undefined;
    try {
      if (excludedJSON) excluded = JSON.parse(excludedJSON);
    } catch (error) {}
    let ids = undefined;
    try {
      if (idsJSON) ids = JSON.parse(idsJSON);
    } catch (error) {}

    this.addEolFilter();
    // if (this._options.auth) { // TODO Hier eine Dynamische alternative finden
    //   this._queryBuilder.match({
    //     ofUserGroup: new mongoose.Types.ObjectId(this._options.auth.ofUserGroup),
    //   });
    // }

    // console.log("Excluded"); // TODO Excluded funktion testen!! Die ids genauso da sie beiden arrays sind und über den body kommen
    // console.log(excluded);
    try {
      if (id) {
        this._queryBuilder.match({
          _id: new mongoose.Types.ObjectId(id as string),
        });
      } else if (ids) {
        const objectIds = ids.map((x: string) => new mongoose.Types.ObjectId(x));
        this._queryBuilder.match({ _id: { $in: objectIds } });
      } else {
        let filterFields: FilterFields = [];
        const collectionName = this._options.model.collection.collectionName;
        // TODO Hier muss eine neue Struktur implementiert werden, mit denen man Pfade und Logik dynamisch setzen kann
        for (let [collectionURL, collectionOption] of Object.entries(collectionOptions)) {
          if (collectionOption.model.collection.name == collectionName) {
            filterFields = collectionOption.collectionFilter;
            break;
          }
        }
        if (filter && filterFields.length > 0) {
          const ors = filterFields.map((f: string) => ({
            [f]: { $regex: filter, $options: 'i' },
          }));
          this._queryBuilder.match({ $or: ors });
        }
        if (excluded) {
          const objectIds = excluded.map((x: string) => new mongoose.Types.ObjectId(x));
          this._queryBuilder.match({ _id: { $nin: objectIds } });
        }
      }
      return await this._queryBuilder.exec({
        isOne: Boolean(id != undefined),
        limit: limit == undefined || limit === 'full' ? undefined : parseInt(limit),
        skip: offset == undefined ? undefined : parseInt(offset),
      });
    } catch (err) {
      console.error('[ERROR - GetCollectionQueryBuilder]', err);
      return new Codec<CollectionResponse>({ data: [], meta: { total: 0 } }, 500);
    }
  }
}
