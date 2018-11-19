/**
 * Equivalent _.get function from lodash.
 *
 * @param path {string}
 * @param obj {Object}
 * @param separator {string}
 */
function resolve(path, obj = {}, separator = '.') {
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
}

module.exports = {
    resolve,
};
