const PermissionGuard = require('../index');
const { PermissionError } = require('../errors');


describe('PermissionGuard class', () => {
  it('should instantiate with default options', () => {
    const guard = new PermissionGuard();

    expect(guard.options).toBeDefined();
    expect(guard.options.checkFunction).toBeDefined();
    expect(guard.options.getPermissionsFromAction).toBeDefined();
    expect(guard.options.getUserPermissions).toBeDefined();
  });

  it('should instantiate with user options', () => {
    const checkFunction = jest.fn();
    const getPermissionsFromAction = jest.fn();
    const getUserPermissions = jest.fn();

    const guard = new PermissionGuard({
      checkFunction,
      getPermissionsFromAction,
      getUserPermissions,
    });

    expect(guard.options).toBeDefined();
    expect(guard.options.checkFunction).toEqual(checkFunction);
    expect(guard.options.getPermissionsFromAction).toEqual(getPermissionsFromAction);
    expect(guard.options.getUserPermissions).toEqual(getUserPermissions);
  });

  it('should create a simple permissions error', () => {
    const err = new PermissionError('Not allowed');

    expect(err).toBeInstanceOf(Error);
  });

  describe('check fun', () => {
    it('should call checkFunction if perm names', async () => {
      const checkFunction = jest.fn(() => true);
      const guard = new PermissionGuard({ checkFunction });

      await guard.check({ permNames: ['test'], permFuncs: [] });

      expect(checkFunction).toHaveBeenCalledTimes(1);
    });

    it('should not call checkFunction if no perms names', async () => {
      const checkFunction = jest.fn(() => true);
      const guard = new PermissionGuard({ checkFunction });

      await guard.check({ permNames: [], permFuncs: [() => true] });

      expect(checkFunction).not.toHaveBeenCalled();
    });

    it('should call each fn in permFuncs', async () => {
      const fn1 = jest.fn(() => true);
      const fn2 = jest.fn(() => true);
      const guard = new PermissionGuard();

      await guard.check({ permNames: [], permFuncs: [fn1, fn2] });

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('should wait for async fn in permFuncs', async () => {
      let hasWaited = false;
      const fn1 = jest.fn(() => new Promise((resolve => setTimeout(() => {
        hasWaited = true;
        resolve(true);
      }, 200))));
      const guard = new PermissionGuard();

      await guard.check({ permNames: [], permFuncs: [fn1] });

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(hasWaited).toBe(true);
    });

    it('should throw with only permNames and checkFun => false', async () => {
      const checkFunction = jest.fn(() => false);
      const guard = new PermissionGuard({ checkFunction });

      await expect(guard.check({ permNames: ['test'], permFuncs: [] })).rejects.toBeInstanceOf(PermissionError);
      expect(checkFunction).toHaveBeenCalled();
    });

    it('should throw with only permFuns and all return false', async () => {
      const guard = new PermissionGuard();

      await expect(guard.check({ permNames: [], permFuncs: [() => false] })).rejects.toBeInstanceOf(PermissionError);
    });

    it('should throw with permNames and permFuns returning false', async () => {
      const checkFunction = jest.fn(() => false);
      const guard = new PermissionGuard({ checkFunction });

      await expect(guard.check({ permNames: ['test'], permFuncs: [() => false] })).rejects
        .toBeInstanceOf(PermissionError);
    });
  });

  describe('getPermissionsFromAction', () => {
    const { getPermissionsFromAction } = new PermissionGuard().options;

    it('should return array directly', () => {
      expect(getPermissionsFromAction({ permissions: ['test'] })).toEqual(['test']);
    });

    it('should return array from action if permissions === true', () => {
      expect(getPermissionsFromAction({ permissions: true, name: 'test' })).toEqual(['test']);
    });

    it('should return array if one item', () => {
      expect(getPermissionsFromAction({ permissions: 'test' })).toEqual(['test']);
    });
  });

  describe('getUserPermissions', () => {
    const { getUserPermissions } = new PermissionGuard().options;

    const item = {};

    it('should resolve user permissions from ctx', () => {
      expect(getUserPermissions({ meta: { user: { permissions: item } } })).toBe(item);
    });
  });

  describe('checkFunction', () => {
    const { checkFunction } = new PermissionGuard().options;

    it('should work if no permissions requested', () => {
      expect(checkFunction([], [])).toBe(true);
    });

    it('should not work if current is null', () => {
      expect(checkFunction(null, ['test'])).not.toBe(true);
    });

    it('should not work if missing request perm', () => {
      expect(checkFunction(['other'], ['test'])).not.toBe(true);
    });

    it('should work if current === requested', () => {
      expect(checkFunction(['test'], ['test'])).toBe(true);
    });

    it('should work if current have more than requested', () => {
      expect(checkFunction(['test', 'other'], ['test'])).toBe(true);
    });
  });

  describe('Middleware function', () => {
    it('should be disabled if there are no permissions on the action', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn();
      const action = {};

      const res = middleware(handler, action);

      expect(res).toEqual(handler);
    });

    it('should be disabled if permissions are empty', () => {
      const middleware = new PermissionGuard({
        getPermissionsFromAction: () => [],
      }).middleware().localAction;

      const handler = jest.fn();
      const action = { permissions: [] };

      const res = middleware(handler, action);

      expect(res).toEqual(handler);
    });

    it('should wrap the handler inside a new fn', () => {
      const middleware = new PermissionGuard().middleware().localAction;
      const handler = jest.fn();
      const action = { permissions: ['test'] };

      const res = middleware(handler, action);

      expect(res).not.toEqual(handler);
    });

    it('should call the handler after checking', async () => {
      const permissionGuard = new PermissionGuard();
      permissionGuard.check = jest.fn(() => true);
      const middleware = permissionGuard.middleware().localAction;
      const handler = jest.fn(ctx => 'Yeah');
      const action = { permissions: ['test'] };
      const ctx = { meta: { user: { permissions: ['test'] } } };
      const fn = middleware(handler, action);

      await fn(ctx);

      expect(handler).not.toBe(fn);
      await expect(handler).toHaveBeenCalled();
    });

    it('should separate function from strings', async () => {
      const permissionGuard = new PermissionGuard();
      permissionGuard.check = jest.fn(() => true);
      const middleware = permissionGuard.middleware().localAction;
      const handler = jest.fn(ctx => 'Yeah');
      const fn1 = () => true;
      const action = { permissions: ['test', fn1] };

      const fn = middleware(handler, action);

      await fn();

      await expect(permissionGuard.check).toHaveBeenCalledWith(expect.objectContaining({
        permNames: ['test'],
        permFuncs: [fn1],
      }));
    });

    it('should create an owner function', async () => {
      const permissionGuard = new PermissionGuard();
      permissionGuard.check = jest.fn(() => true);
      const middleware = permissionGuard.middleware().localAction;
      const handler = jest.fn(ctx => 'Yeah');
      const action = { permissions: ['$owner'] };

      const fn = middleware(handler, action);

      await fn();

      await expect(permissionGuard.check).toHaveBeenCalledWith(expect.objectContaining({
        permNames: [],
        permFuncs: [expect.anything()],
      }));
    });

    it('should call the owner function', async () => {
      const permissionGuard = new PermissionGuard();
      permissionGuard.check = jest.fn(({ permFuncs }) => permFuncs[0]({ service: { isEntityOwner: fn1 } }));
      const middleware = permissionGuard.middleware().localAction;
      const handler = jest.fn();
      const fn1 = jest.fn();
      const action = { permissions: ['$owner'] };
      const fn = middleware(handler, action);

      await fn();

      await expect(fn1).toHaveBeenCalled();
    });

    it('should ignore if owner function not defined', async () => {
      const permissionGuard = new PermissionGuard();
      permissionGuard.check = jest.fn(({ permFuncs }) => permFuncs[0]({ service: {} }));
      const middleware = permissionGuard.middleware().localAction;
      const handler = jest.fn();
      const action = { permissions: ['$owner'] };
      const fn = middleware(handler, action);

      await fn();

      await expect(permissionGuard.check).toHaveReturnedWith(false);
    });

    it('should ignore if perm is not function or string', async () => {
      const permissionGuard = new PermissionGuard();
      permissionGuard.check = jest.fn(() => true);
      const middleware = permissionGuard.middleware().localAction;
      const handler = jest.fn(ctx => 'Yeah');
      const action = { permissions: [3.14] };

      const fn = middleware(handler, action);

      await fn();

      await expect(permissionGuard.check).toHaveBeenCalledWith(expect.objectContaining({
        permNames: [],
        permFuncs: [],
      }));
    });
  });
});
