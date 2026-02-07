import mongoose from 'mongoose';

export interface DefaultResponseBody extends Record<string, any> {
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

export type DefaultCodec = Codec<DefaultResponseBody>;
export type PromiseDefaultCodec = Promise<Codec<DefaultResponseBody>>;

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

export interface QueryBuilderConfig<T = any> {
  model: mongoose.Model<T>;
  select?: string[] | undefined; //TODO Eventuell den namen überarbeiten
  eachFunc?: (doc: any) => any;
  asyncEachFunc?: (doc: any) => Promise<any>;
}

export enum HttpMethod {
  POST = 'post',
  GET = 'get',
  DELETE = 'delete',
  PUT = 'put',
}

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  /**
   * Optional query parameters to be appended to the URL. They will be automatically URL-encoded. For example, { search: 'test', page: '1' } will result in ?search=test&page=1 being appended to the URL.
   */
  urlSearchParams?: Record<string, string>;
  /**
   * The body can be an object or a string. If it's an object, it will be automatically stringified as JSON and the Content-Type header will be set to application/json. If it's a string, it will be sent as-is and the Content-Type header will default to application/x-www-form-urlencoded unless explicitly set in the headers.
   */
  body?: any;
  /**
   * Optional headers to include in the request. If the body is an object and Content-Type is not explicitly set, it will default to application/json. If the body is a string and Content-Type is not explicitly set, it will default to application/x-www-form-urlencoded. You can override these defaults by providing your own Content-Type header.
   */
  headers?: Record<string, string>;
}