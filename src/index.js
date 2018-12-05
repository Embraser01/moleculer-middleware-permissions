const { PermissionError } = require('./errors');
const { resolve } = require('./helpers');

function basicPermissionCheck(current, requested) {
  const missingPerms = Array.isArray(current) ? requested.filter(p => !current.includes(p)) : requested;
  if (missingPerms.length === 0) return true;

  return `You don't have enough permissions in order to do that! Missing permissions: ${missingPerms.join(', ')}`;
}

class PermissionGuard {
  /**
   * Permission Guard constructor.
   *
   * @param options {Object}
   * @param options.checkFunction {Function} A check function which return true
   *      if the request is accepted or a object explaining why the request was rejected
   * @param options.permissionsPath {string} Path where permissions should be (starting from ctx)
   * @param options.permissionsSep {string} Separator used in permissions (default: ':')
   * @param options.pathSeparator {string} Path separator in the cae you have `.` in a property
   */
  constructor(options) {
    this.options = {
      checkFunction: basicPermissionCheck,
      permissionsPath: 'meta.user.permissions',
      permissionsSep: ':',
      pathSeparator: undefined,
      ...options,
    };
  }

  /**
   * Check if an user permissions contains all the requested permissions.
   * Throw an PermissionError if there is not enough permission.
   * Will use the provided checkFunction if defined.
   *
   * @param current [Array<string>} User permissions
   * @param requested {Array<string>} Requested permissions
   */
  check(current, requested) {
    const result = this.options.checkFunction(current, requested, this.options);

    if (result !== true) {
      throw new PermissionError('Insufficient permissions', null, result);
    }
  }

  /**
   * Replace dots in the action by the permissions separator.
   *
   * @param actionName {string} Action full name.
   */
  _sanitizeName(actionName) {
    return actionName.split('.').join(this.options.permissionsSep);
  }

  /**
   * Return a moleculer middleware.
   */
  middleware() {
    return {
      localAction: (handler, action) => {
        let perms = action.permissions;
        if (perms === true) perms = [this._sanitizeName(action.name)];

        if (!Array.isArray(perms)) return handler;

        // Save the real checked perms inside the action
        // It allows other components to know what permissions are really checked
        action.rawPermissions = Object.freeze(perms);

        return (ctx) => {
          this.check(resolve(this.options.permissionsPath, ctx, this.options.pathSeparator), perms);
          return handler(ctx);
        };
      },
    };
  }
}

module.exports = PermissionGuard;
