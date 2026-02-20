import { Request, Response } from 'express';
import { DefaultResponseBody, KeysEnum, QueryBuilder } from '../core/index';

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

export type FluentExpressRequest = Request<
  any,
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
