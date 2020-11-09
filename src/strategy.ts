/**
 * Module dependencies.
 */
import { Strategy } from 'passport-strategy';
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import * as jose from 'jose';

type Options = {
  clientId?: string | string[],
  appleIdKeysUrl?: string,
  passReqToCallback?: boolean,
  appleIssuer?: string
};

/**
 * `Strategy` constructor.
 *
 * The SignIn with Apple authentication strategy authenticates requests by verifying the
 * signature and fields of the token.
 *
 * Applications must supply a `verify` callback which accepts the `idToken`
 * coming from the user to be authenticated, and then calls the `done` callback
 * supplying a `parsedToken` (with all its information in visible form) and the
 * `appleId`.
 *
 * Options:
 * - `appleIdKeysUrl` // Specify the url to get Apple auth keys
 *
 * Examples:
 *
 * passport.use(new AppleTokenStrategy({
 *     clientID: 'apple_client_id', // Specify the CLIENT_ID of the app that accesses the backend
 *     // Or, if multiple clients access the backend:
 *     //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
 *     appleIdKeysUrl?: 'https://appleid.apple.com/auth/keys', // OPTIONAL: Specify the url to get Apple auth keys
 *     passReqToCallback?: false, // OPTIONAL: Specify if the request is passed to callback
 *     appleIssuer?: 'https://appleid.apple.com' OPTIONAL: the Apple token issuer
 *   },
 *   function(parsedToken, appleId, done) {
 *     User.findOrCreate(..., function (err, user) {
 *       done(err, user);
 *     });
 *   }
 * ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
export class AppleTokenStrategy extends Strategy {
  public name: string;
  public verify: (...args: any[]) => void;
  public passReqToCallback: boolean;
  public appleIdKeysUrl: string;
  public clientId?: string | string[];
  public appleIssuer?: string;

  constructor(options: (() => Options) | Options, verify?: (...args: any[]) => void) {
    super();

    if (typeof options === 'function') {
      verify = options;
      options = {};
    }

    if (!verify) {
      throw new Error('AppleVerifyTokenStrategy requires a verify function');
    }

    this.appleIdKeysUrl = options.appleIdKeysUrl || 'https://appleid.apple.com/auth/keys';
    this.appleIssuer = options.appleIssuer || 'https://appleid.apple.com';
    this.clientId = options.clientId;

    this.passReqToCallback = options.passReqToCallback || false;

    this.name = 'apple-verify-token';

    this.verify = verify;

  }

  /**
   * Authenticate request by verifying the token
   *
   * @param {Object} req
   * @api protected
   */
  public authenticate(req: any, options: any) {
    options = options || {};

    const idToken =
      this.paramFromRequest(req, 'id_token') ||
      this.paramFromRequest(req, 'access_token') ||
      this.getBearerToken(req.headers);

    if (!idToken) {
      return this.fail({ message: 'no ID token provided' }, 401);
    }

    this.verifyAppleToken(idToken)
      .then((appleIdDecoded) => {
        const verified = (error: any, user: any, infoOnUser: any) => {
          if (error) {
            return this.error(error);
          }
          if (!user) {
            return this.fail(infoOnUser);
          }
          this.success(user, infoOnUser);
        };

        if (this.passReqToCallback) {
          this.verify(req, appleIdDecoded, appleIdDecoded.sub, verified);
        } else {
          this.verify(appleIdDecoded, appleIdDecoded.sub, verified);
        }
      })
      .catch(error => this.fail({ message: error.message }, 401))

  }

  /**
   * Verify signature and token fields
   * To verify the identity token, your app server must:
   * Verify the JWS E256 signature using the server’s public key
   * 
   * Verify the nonce for the authentication
   * 
   * Verify that the iss field contains https://appleid.apple.com
   * 
   * Verify that the aud field is the developer’s client_id
   * 
   * Verify that the time is earlier than the exp value of the token
   *
   * @param {String} idToken
   * @api protected
   */
  async verifyAppleToken(idToken: string): Promise<any> {

    // we configure jose
    const {
      JWKS,  // JSON Web Key Set (JWKS)
      JWT,   // JSON Web Token (JWT)
      errors // errors utilized by jose
    } = jose;
    // we request the public keys from apple
    const axiosResponse = await axios.get(this.appleIdKeysUrl);
    const appleJWKS = axiosResponse.data;

    // we set the keys on jose
    const key = jose.JWKS.asKeyStore(appleJWKS);

    try {
      const verified = jose.JWT.verify(idToken, key, {
        issuer: this.appleIssuer,
        audience: this.clientId
      });

      if (verified) {
        return verified;
      }
    } catch (e) {
      throw e;
    }
  }

  /**
   * Gets the id token value from req using name for lookup in req.body, req.query,
   * and req.params.
   * @param {express.Request} req
   * @param {string} name  the key to use to lookup id token in req.
   * @api protected
   */
  private paramFromRequest(req: any, name: string) {
    const body = req.body || {};
    const query = req.query || {};
    const params = req.params || {};
    const headers = req.headers || {};
    if (body[name]) {
      return body[name];
    }
    if (query[name]) {
      return query[name];
    }
    if (headers[name]) {
      return headers[name];
    }
    return params[name] || '';
  }

  private getBearerToken(headers: any) {
    if (headers && headers.authorization) {
      const parts = headers.authorization.split(' ');
      return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : undefined;
    }
  }
}
