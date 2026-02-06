import mongoose from 'mongoose';
import { Request, Response } from 'express';

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

export interface FluentRequestParams extends Record<string, string> {
  collection: string;
}
export interface FluentRequestBody {} // GET requests do not have body

export interface FluentRequestQuery {
  id?: string;
  ids?: string; // as JSON
  filter?: string;
  offset?: string;
  limit?: string;
  order?: string;
  excluded?: string; // as JSON
}

export interface FluentResponseBody extends Record<string, any> {
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
      res.status(404).json({});
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

export interface FluentAPIPath<T = any> {
  // Required: Model
  model: mongoose.Model<T>;
  // Optional: Fields to select
  fields?: string[];
  // Optional: Query filters
  filters?: Record<string, any>;
}

export type FluentExpressRequest = Request<
  FluentRequestParams,
  FluentResponseBody,
  FluentRequestBody,
  FluentRequestQuery
>;

export type FluentExpressResponse = Response<FluentResponseBody>;

/**
 * Configuration for executing a query request, including the request details, model to query, optional relations, and processing functions.
 */
export interface FluentExecuteConfig<T = any> {
  req: FluentExpressRequest;
  model: mongoose.Model<T>;
  relations?: JoinRelation | JoinRelation[];
  match?: Record<string, any>;
  stages?: any[] | {};
  eachFunc?: (doc: any) => any;
  asyncEachFunc?: (doc: any) => Promise<any>;
  select?: string[] | undefined;
}

/**
 * Configuration for a query execution
 */
export interface QueryBuilderExecuteConfig {
  isOne?: boolean;
  limit?: number;
  skip?: number;
}