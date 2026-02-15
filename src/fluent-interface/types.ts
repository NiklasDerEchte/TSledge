import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { DefaultResponseBody, KeysEnum, QueryBuilder } from '../core/index';

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

/**
 * Attributes of FluentRequestQuery used for validation and parsing.
 */
export const fluentRequestQueryAttributes: KeysEnum<FluentRequestQuery> = {
  id: '',
  ids: '',
  filter: '',
  offset: '',
  limit: '',
  order: '',
  excluded: '',
};

export interface FluentAPIOption<T = any> {
  // Required: Model
  model: mongoose.Model<T>;
  // Optional: Query filters, fields in the model by which you can filter
  filters?: string[];
}

export type FluentExpressRequest = Request<
  FluentRequestParams,
  DefaultResponseBody,
  FluentRequestBody,
  FluentRequestQuery
>;

export type FluentExpressResponse = Response<DefaultResponseBody>;

export type FluentExecParams = {
  req: FluentExpressRequest;
  res: FluentExpressResponse;
  queryBuilder: QueryBuilder;
};

export type FluentMiddleware = (params: FluentExecParams) => void;
