const { MoleculerClientError } = require('moleculer').Errors;

class PermissionError extends MoleculerClientError {
    constructor(message, type, data) {
        super(message, 401, type || 'PERMISSION_ERROR', data);
    }
}

module.exports = {
    PermissionError,
};
