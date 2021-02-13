function regexMatch(regex: string): ValidatorFunctionType {
  return function (str: string): [boolean, string] {
    const searchRegex: RegExp = new RegExp(regex);

    return [
      searchRegex.test(str),
      `${str} doesn't match the given regular expression pattern`,
    ];
  };
}

function isEmail(str: string): [boolean, string] {
  const emailRegex: RegExp = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return [emailRegex.test(str), `${str} is not a email`];
}

function minLength(length: number): ValidatorFunctionType {
  return function (str: string): [boolean, string] {
    return [str.length > length, `${str} has less than ${length} characters`];
  };
}

function maxLength(length: number): ValidatorFunctionType {
  return function (str: string): [boolean, string] {
    return [str.length < length, `${str} has more than ${length} characters`];
  };
}

export { regexMatch, isEmail, minLength, maxLength };
