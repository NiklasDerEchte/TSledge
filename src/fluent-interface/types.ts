import mongoose from 'mongoose';
import { Request } from 'express';

export class JoinRelation<T = any> {
  ref: mongoose.Model<T>;
  localField: string;
  alias: string;

  constructor(localField: string, ref: mongoose.Model<T>, alias: string | undefined = undefined) {
    this.ref = ref;
    this.localField = localField;
    this.alias = alias ? alias : ref.collection.name;
  }
}

export interface GetCollectionQueryOptions<T = any> {
  model: mongoose.Model<T>;
  req: Request<CollectionParams, CollectionResponse, CollectionBody, CollectionQuery>;
  relations?: JoinRelation | JoinRelation[];
  match?: Record<string, any>;
  stages?: any[] | {};
  eachFunc?: (doc: any) => any;
  asyncEachFunc?: (doc: any) => Promise<any>;
  select?: string[] | undefined;
}

export interface QueryBuilderOptions<T = any> {
  model: mongoose.Model<T>;
  relations?: JoinRelation | JoinRelation[];
  match?: Record<string, any>;
  stages?: any[] | {};
  eachFunc?: (doc: any) => any;
  asyncEachFunc?: (doc: any) => Promise<any>;
  select?: string[] | undefined;
}

export interface QueryBuilderExecOptions {
  isOne?: boolean;
  limit?: number;
  skip?: number;
}

export interface CollectionParams extends Record<string, string> {
  collection: string;
}
export interface CollectionBody {} // GET requests do not have body

export interface CollectionQuery {
  filter?: string;
  offset?: string;
  limit?: string;
  order?: string;
  id?: string;
  excluded?: string; // as JSON
  ids?: string; // as JSON
}

export interface CollectionResponse extends Record<string, any> {
  data?: any[] | any;
  meta?: { total?: number };
  error?: string;
}

export class Codec<T = any> {
  content: T;
  returnCode: number;

  constructor(content: T, code: number = 202) {
    this.content = content;
    this.returnCode = code;
  }

  sendToClient(res: any) {
    if (this.content == null) {
      res.status(404).json({ Error: 'Ein Fehler ist aufgetreten! Schau auf dem Server nach.' });
    }
    res.status(this.returnCode).json(this.content);
  }

  is1xx() {
    return this.returnCode >= 100 && this.returnCode <= 199;
  }
  is2xx() {
    return this.returnCode >= 200 && this.returnCode <= 299;
  }
  is3xx() {
    return this.returnCode >= 300 && this.returnCode <= 399;
  }
  is4xx() {
    return this.returnCode >= 400 && this.returnCode <= 499;
  }
}

export type FilterFields = string[];
export interface CollectionOption<T = any> {
  [route: string]: {
    model: mongoose.Model<T>;
    collectionFilter: FilterFields;
  };
}

export interface QueryPatternPath<T = any> {
  // Required: Model
  entity: mongoose.Model<T>;
  // Optional: Fields to select
  fields?: string[];
  // Optional: Query filters
  filters?: Record<string, any>;
}

export type QueryPatternConfig = QueryPatternPath[];