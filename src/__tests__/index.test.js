const PermissionGuard = require('../index');
const { PermissionError } = require('../errors');

describe('PermissionGuard class', () => {
  it('should instantiate with default options', () => {
    const guard = new PermissionGuard();

    expect(guard.options).toBeDefined();
    expect(guard.options.checkFunction).toBeDefined();
    expect(guard.options.permissionsPath).toEqual('meta.user.permissions');
    expect(guard.options.permissionsSep).toEqual(':');
  });

  it('should instantiate with user options', () => {
    const checkFunction = jest.fn();

    const guard = new PermissionGuard({
      checkFunction,
      permissionsPath: 'my.custom.path',
      permissionsSep: '.',
    });

    expect(guard.options).toBeDefined();
    expect(guard.options.checkFunction).toEqual(checkFunction);
    expect(guard.options.permissionsPath).toEqual('my.custom.path');
    expect(guard.options.permissionsSep).toEqual('.');
  });

  it('should sanitize name with the permissionsSep options', () => {
    const guard = new PermissionGuard({ permissionsSep: '|' });

    expect(guard._sanitizeName('service.action.name')).toBe('service|action|name');
  });

  describe('check fun', () => {
    it('should call checkFunction once', () => {
      const checkFunction = jest.fn();
      const guard = new PermissionGuard({ checkFunction });

      try {
        guard.check([], []);
      } catch (e) {
        // ignored
      }

      expect(checkFunction).toHaveBeenCalledTimes(1);
    });

    it('should not throw if checkFunction return true', () => {
      const checkFunction = jest.fn(() => true);
      const guard = new PermissionGuard({ checkFunction });

      guard.check([], []);
    });

    it('should throw if checkFunction return truthy value', () => {
      const checkFunction = jest.fn(() => 'true');
      const guard = new PermissionGuard({ checkFunction });

      expect(() => guard.check([], [])).toThrow(PermissionError);
    });

    it('should throw if checkFunction return falsy value', () => {
      const checkFunction = jest.fn(() => false);
      const guard = new PermissionGuard({ checkFunction });

      expect(() => guard.check([], [])).toThrow(PermissionError);
    });

    it('should not fail if current is not an array', () => {
      const guard = new PermissionGuard();

      expect(() => guard.check('Not an array', [])).not.toThrow();
    });
  });

  describe('Middleware function', () => {
    it('should be disabled if there is no permissions on the action', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn();
      const action = {};

      const res = middleware(handler, action);

      expect(res).toEqual(handler);
    });

    it('should be disabled if permissions is not an array', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn();
      const action = { permissions: 'Not an array' };

      const res = middleware(handler, action);

      expect(res).toEqual(handler);
    });

    it('should wrap the handler inside a new fn', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn();
      const action = { permissions: [] };

      const res = middleware(handler, action);

      expect(res).not.toEqual(handler);
    });

    it('should call the handler after checking', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn(ctx => 'Yeah');
      const action = { permissions: [] };
      const ctx = { meta: { user: { permissions: [] } } };
      const fn = middleware(handler, action);

      // If not fail, accepted
      const res = fn(ctx);

      expect(res).toEqual('Yeah');
    });

    it('should throw before calling handler', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn();
      const action = { permissions: ['admin:action'] };
      const ctx = { meta: { user: { permissions: [] } } };
      const fn = middleware(handler, action);

      expect(() => fn(ctx)).toThrow(PermissionError);
    });

    it('should use default action name if permissions === true', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn(ctx => 'Yeah');
      const action = { permissions: true, name: 'service.name' };
      const ctx = { meta: { user: { permissions: ['service:name'] } } };
      const fn = middleware(handler, action);

      // If not fail, accepted
      const res = fn(ctx);

      expect(res).toEqual('Yeah');
    });
  });
});
