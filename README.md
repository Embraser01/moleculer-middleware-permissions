# Moleculer Middleware Permissions

Check action permissions.

[![codecov](https://codecov.io/gh/Embraser01/moleculer-middleware-permissions/branch/master/graph/badge.svg)](https://codecov.io/gh/Embraser01/moleculer-middleware-permissions)
[![Travis (.com)](https://img.shields.io/travis/com/Embraser01/moleculer-middleware-permissions.svg)](https://github.com/Embraser01/moleculer-middleware-permissions)
![NpmLicense](https://img.shields.io/npm/l/moleculer-middleware-permissions.svg)
![npm](https://img.shields.io/npm/v/moleculer-middleware-permissions.svg)
![node](https://img.shields.io/node/v/moleculer-middleware-permissions.svg)


## Install

> This module requires at least Node v8.3.0.

```bash
yarn add moleculer-middleware-permissions
```

## Usage

```js
// moleculer.config.js
const PermissionGuard = require('moleculer-middleware-permissions');

const guard = new PermissionGuard({options});

module.exports = {
    ...
    middlewares: [
        guard.middleware(),
    ],
};
```

```js
// service.js
module.exports = {
  name: 'awesome.service',
   actions: {
       hello: {
         // The user must have both 'hello:read' AND 'hello:name'
         // You can override this behaviour by passing your 'checkFunction'
         permissions: ['hello.read', '$owner', (ctx) => ctx.call('acl.canSayHello')],
         handler (ctx) {
           const {name} = ctx.params;
           return `Hello ${name}`;
         }
       },
       me: {
          // Will check for these permissions: ['awesome.service.me']
          permissions: true,
          handler (ctx) {
            return `Hello me`;
          }
        }
     }
};
```

## Options

- `checkFunction(current, requested)`: A function that return `true` if the request has enough
  permissions. Else, the return value will be send in the rejected `PermissionError`.
- `getPermissionsFromAction(action)`: Called to return an array of permissions from an action.
- `getUserPermissions(ctx)`: Function called to retrieve user's permissions. By default will
  return `meta.user.permissions`.

## Permissions type

### A string

The simplest way to add permissions is to use a list of strings, representing each a
permissions, like this:
- `members.read`: Can list/get/find members
- `members.write`: Can update/remove/create members

It will be checked before any functions and if it allows to access, function **will not** be
checked!

### `$owner`

If you want the owner of the entity to be able to update it but not other ones, you can use this
special permissions. It will try to call the method `isEntityOwner(ctx)` of your service.
Returning a truthy value will act as allowed.

This method can be async.

### A function

You can also provide functions to check if the user is allowed to access an action. It will be
called only if strings aren't allowed first. Only one function needs to return a truthy value to
be allowed!

This method can be async.

> You can override this behaviour by overriding the `check` method the class.

# License

MIT
