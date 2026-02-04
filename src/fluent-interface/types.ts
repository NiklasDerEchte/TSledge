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

export interface FluentParams extends Record<string, string> {
  collection: string;
}
export interface FluentBody {} // GET requests do not have body

export interface FluentQuery {
  id?: string;
  ids?: string; // as JSON
  filter?: string;
  offset?: string;
  limit?: string;
  order?: string;
  excluded?: string; // as JSON
}

export interface FluentResponse extends Record<string, any> {
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

export interface QueryPatternPath<T = any> {
  // Required: Model
  model: mongoose.Model<T>;
  // Optional: Fields to select
  fields?: string[];
  // Optional: Query filters
  filters?: Record<string, any>;
}

/**
 * Configuration for executing a query request, including the request details, model to query, optional relations, and processing functions.
 */
export interface QueryRequestConfig<T = any> {
  req: Request<FluentParams, FluentResponse, FluentBody, FluentQuery>;
  model: mongoose.Model<T>;
  relations?: JoinRelation | JoinRelation[];
  match?: Record<string, any>;
  stages?: any[] | {};
  eachFunc?: (doc: any) => any;
  asyncEachFunc?: (doc: any) => Promise<any>;
  select?: string[] | undefined;
}

/**
 * 
 */
export interface QueryParameters {
  isOne?: boolean;
  limit?: number;
  skip?: number;
}