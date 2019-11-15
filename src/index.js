const { resolve } = require('./helpers');
const { PermissionError } = require('./errors');

const checkFunction = (current, requested) => {
  const missingPerms = Array.isArray(current) ? requested.filter(p => !current.includes(p)) : requested;
  if (missingPerms.length === 0) return true;

  return `You don't have enough permissions in order to do that! Missing permissions: ${missingPerms.join(', ')}`;
};

const getPermissionsFromAction = (action) => {
  const { permissions, name } = action;

  if (Array.isArray(permissions)) return permissions;
  if (permissions === true) return [name];
  return [permissions];
};

const getUserPermissions = (ctx) => {
  return resolve('meta.user.permissions', ctx);
};

class PermissionGuard {
  /**
   * Permission Guard constructor.
   *
   * @param options {Object}
   * @param options.checkFunction {Function} A check function that return true
   *      if the request is accepted, or an object explaining why the request was rejected
   * @param options.getPermissionsFromAction {Function} Return permissions from action.
   * @param options.getUserPermissions {Function} Return permissions from context.
   */
  constructor(options = {}) {
    this.options = {
      checkFunction,
      getPermissionsFromAction,
      getUserPermissions,
      ...options,
    };
  }

  /**
   * Check permissions of a user.
   * Given:
   * ```
   *   myAction: {
   *     permissions: [
   *       'user.get',
   *       () => true,
   *       'user.write',
   *       '$owner'
   *     ]
   *     ...
   *   }
   *
   * ```
   * It will be split in 2 parts. First, it will check string permissions using the `checkFunction`.
   * If it doesn't return true, it will test functions and specials ($owner).
   *
   * If the `checkFunction` returned `true` or any function returned a truthy value, it will
   * be considered as allowed and will call the next handler.
   *
   * Throw an PermissionError if there is not enough permission.
   *
   * `'$owner'` is a special perm that will call the method `isEntityOwner` of the action's service.
   */
  async check({ permNames, permFuncs, current, ctx }) {
    let res = false;
    if (permNames.length > 0) {
      res = await this.options.checkFunction(current, permNames);
    }

    if (res !== true) {
      if (permFuncs.length > 0) {
        const results = await Promise.all(permFuncs.map(async fn => fn.call(this, ctx)));
        res = results.some(r => !!r);
      }

      if (res !== true) {
        throw new PermissionError('You have no right for this operation!', 'ERR_HAS_NO_ACCESS', { res });
      }
    }
  }

  /**
   * Return a moleculer middleware.
   */
  middleware() {
    return {
      localAction: (handler, action) => {
        if (!action.permissions) return handler;

        const actionPerms = this.options.getPermissionsFromAction(action);

        if (!actionPerms.length) return handler;

        const permNames = [];
        const permFuncs = [];
        actionPerms.forEach((p) => {
          if (typeof p === 'function') {
            // Add custom permission function
            permFuncs.push(p);
            return;
          }

          if (typeof p === 'string') {
            if (p === '$owner') {
              // Check if user is owner of the entity
              permFuncs.push((ctx) => {
                if (typeof ctx.service.isEntityOwner === 'function') {
                  return ctx.service.isEntityOwner.call(this, ctx);
                }
                return false;
              });
              return;
            }

            // Add a role or permission name
            permNames.push(p);
          }
        });

        return async (ctx) => {
          await this.check({
            current: await this.options.getUserPermissions(ctx),
            permNames,
            permFuncs,
            ctx,
          });
          return handler(ctx);
        };
      },
    };
  }
}

module.exports = PermissionGuard;
