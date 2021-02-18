import { Query, Document } from "mongoose";
import { ParsedQs } from "qs";

class APIOperations<K extends Document<any>> {
  query: Query<K[], K>;
  requestQueryObject: ParsedQs;

  constructor(query: Query<K[], K>, requestQueryObject: ParsedQs) {
    this.query = query;
    this.requestQueryObject = requestQueryObject;
  }

  filter(): this {
    const controls: string[] = ["limit", "sort", "page", "fields"];

    let filteredQueryObject: ParsedQs = { ...this.requestQueryObject };

    controls.forEach((control) => {
      if (filteredQueryObject[control]) delete filteredQueryObject[control];
    });

    // parse the querystring and convert to a mongoose find filter
    const filteredQueryStrings: string = JSON.stringify(
      filteredQueryObject
    ).replace(/\b(gt|gte|lt|lte)\b/g, (match: string) => `$${match}`);
    this.query = this.query.find(JSON.parse(filteredQueryStrings)) as any;

    return this;
  }

  sort(): this {
    if (this.requestQueryObject.sort) {
      const sortFields: string = (this.requestQueryObject.sort as string)
        .split(",")
        .join(" ");

      this.query = this.query.sort(sortFields);
    }
    return this;
  }

  limitFields(): this {
    if (this.requestQueryObject.fields) {
      const selectionFields: string = (this.requestQueryObject.fields as string)
        .split(",")
        .join(" ");

      this.query = this.query.select(selectionFields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate(): this {
    let limit: number = 100;
    let page: number = 1;

    // set limit (if limit query is specified in the query string);
    if (this.requestQueryObject.limit) {
      limit = parseInt(this.requestQueryObject.limit as string);
    }

    // set page (if page query is specified in the query string)
    if (this.requestQueryObject.page) {
      page = parseInt(this.requestQueryObject.page as string);
    }

    // calculate the skip
    let skip: number = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

export default APIOperations;
