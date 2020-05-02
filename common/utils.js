const utils = {
  /**
   * Convert a query param string to a key-value JSON object
   * @param {string} query
   * @return the param object
   */
  queryStringToObject: function (query) {
    let parameters = {};
    const parts = query.split("&");
    for (let part of parts) {
      const pair = part.split("=");
      parameters[pair[0]] = pair[1];
    }
    return parameters;
  },
};

export { utils };
