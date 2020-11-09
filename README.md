# passport-apple-verify-token

[![Build Status](https://dev.azure.com/abdouslayne/Personal%20Projects/_apis/build/status/passport-google-verify-token?branchName=master)](https://dev.azure.com/abdouslayne/Personal%20Projects/_build/latest?definitionId=2?branchName=master)
[![npm version](https://badge.fury.io/js/passport-google-verify-token.svg)](https://badge.fury.io/js/passport-google-verify-token)
![License](https://img.shields.io/npm/l/passport-facebook-token.svg)


[Passport](http://passportjs.org/) strategy for validating [Apple](http://www.apple.com/)
access tokens using the OAuth 2.0 API.

This module lets you validate SignIn with Apple tokens in your Node.js applications.
By plugging into Passport, Apple authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Installation

    $ npm install passport-apple-verify-token

## Usage

### Configure Strategy

The SignIn with Apple authentication strategy validates the id_token received from an iOS app. 
Applications must supply a `verify` callback which accepts the `idToken`
coming from the user to be authenticated, and then calls the `done` callback
supplying a `parsedToken` (with all its information in visible form) and the
`appleId`.

```js
passport.use(new AppleTokenStrategy({
      clientID: 'apple_client_id', // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend: [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      appleIdKeysUrl?: 'https://appleid.apple.com/auth/keys', // OPTIONAL: Specify the url to get Apple auth keys
      passReqToCallback?: false, // OPTIONAL: Specify if the request is passed to callback
      appleIssuer?: 'https://appleid.apple.com' // OPTIONAL: the Apple token issuer
    },
    function(token, appleId, done) {
      User.findOrCreate(..., function (err, user) {
        done(err, user);
      });
    }
  ));
```

### Authenticate Requests

Use `passport.authenticate()`, specifying the `'apple-verify-token'` strategy, to authenticate requests.

```js
app.post('/auth/apple/token',
  passport.authenticate('apple-verify-token'),
  function (req, res) {
    // do something with req.user
    res.send(req.user? 200 : 401);
  }
);
```

Or using Sails framework:

```javascript
// api/controllers/AuthController.js
module.exports = {
  facebook: function(req, res) {
    passport.authenticate('apple-verify-token', function(error, user, info) {
      // do stuff with user
      res.ok();
    })(req, res);
  }
};
```

### Client Requests

Clients can send requests to routes that use apple-verify-token authentication using query parms, body, or HTTP headers. Clients will need to transmit the `access_token` that is received from Apple after user logs in.

#### Sending access_token as a Query parameter

```
GET /auth/apple/token?access_token=<TOKEN_HERE>
```

#### Sending access token as an HTTP header

Clients can choose to send the access token using the Oauth2 Bearer token (RFC 6750) compliant format

```
GET /resource HTTP/1.1
Host: server.example.com
Authorization: Bearer base64_access_token_string
```


#### Sending access token as an HTTP body

Clients can transmit the access token via the body

```
POST /resource HTTP/1.1
Host: server.example.com

access_token=base64_access_token_string
```
  

## Credits

  - [Abdou BOUROUBI](http://github.com/abouroubi)



## License

The MIT License (MIT)

Copyright (c) 2020 Abdou Bouroubi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
