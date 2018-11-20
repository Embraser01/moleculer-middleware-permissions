# Moleculer Middleware Permissions

Check action permissions.

[![codecov](https://codecov.io/gh/Embraser01/moleculer-middleware-permissions/branch/master/graph/badge.svg)](https://codecov.io/gh/Embraser01/moleculer-middleware-permissions)
[![Travis (.com)](https://img.shields.io/travis/com/Embraser01/moleculer-middleware-permissions.svg)](https://github.com/Embraser01/moleculer-middleware-permissions)


## Install

> This module requires at least Node v8.0.0.

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
   actions: {
       hello: {
         // The user must have both 'hello:read' AND 'hello:name'
         // You can override this behaviour by passing your 'checkFunction'
         permissions: ['hello:read', 'hello:name'],
         handler (ctx) {
           const {name} = ctx.params;
           return `Hello ${name}`
         }
       }
     }
};
```

# Options

- `checkFunction`: A function that return `true` if the request has enough permissions.
    Else, the return value will be send in the rejected `PermissionError`.
    For the default behaviour search for `basicPermissionCheck` in `src/index.js`.
- `permissionsPath`: Path to look for the request permissions (from the `ctx` object).
    Default to `meta.user.permissions`,
- `pathSeparator`: Separator to use when there is a `.` in a property.

# License

MIT
