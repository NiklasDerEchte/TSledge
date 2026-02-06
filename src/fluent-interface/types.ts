import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { DefaultResponseBody } from '../core';

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

export interface FluentAPIPath<T = any> {
  // Required: Model
  model: mongoose.Model<T>;
  // Optional: Query filters
  filters?: Record<string, any>;
}

export type FluentExpressRequest = Request<
  FluentRequestParams,
  DefaultResponseBody,
  FluentRequestBody,
  FluentRequestQuery
>;

export type FluentExpressResponse = Response<DefaultResponseBody>;