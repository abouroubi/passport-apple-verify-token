import * as chai from 'chai';
import { Strategy } from '../src';

const passport = require('chai-passport-strategy');

const chaiPassport = chai.use(passport);
const expect = chai.expect;

declare global {
  namespace Chai {
    interface ChaiStatic {
      passport: any;
    }
  }
}

describe('Strategy', async () => {
  const verify = (parsedToken: any, appleId: any, done: (...args: any[]) => void) => {
    return done(null, { id: '1234' }, { scope: 'read' });
  };

  const mockVerifyAppleTokenSuccess = async (idToken: string) => {
    const payload = { sub: 1 };
    return payload;
  };

  const mockVerifyAppleTokenNoParsedToken = async (idToken: string) => {
    throw new Error('Error message');
  };

  const mockVerifyAppleTokenError = async (idToken: string) => {
    throw new Error('Error message');
  };

  const mockToken = '123456790-POIHANPRI-KNJYHHKIIH';

  const strategy = new Strategy(
    {
      clientId: 'DUMMY_CLIENT_ID',
    },
    verify,
  );

  strategy.verifyAppleToken = mockVerifyAppleTokenSuccess;

  const strategyWClientIDArray = new Strategy(
    {
      clientId: ['DUMMY_CLIENT_ID_1', 'DUMMY_CLIENT_ID_2', 'DUMMY_CLIENT_ID', 'DUMMY_CLIENT_ID_3'],
    },
    verify,
  );

  strategyWClientIDArray.verifyAppleToken = mockVerifyAppleTokenSuccess;

  const strategyNoParsedToken = new Strategy(
    {
      clientId: 'DUMMY_CLIENT_ID',
    },
    verify,
  );

  strategyNoParsedToken.verifyAppleToken = mockVerifyAppleTokenNoParsedToken;

  const strategyTokenError = new Strategy(
    {
      clientId: 'DUMMY_CLIENT_ID',
    },
    verify,
  );

  strategyTokenError.verifyAppleToken = mockVerifyAppleTokenError;

  it('should be named apple-verify-token', () => {
    expect(strategy.name).to.equal('apple-verify-token');
  });

  it('should throw if constructed without a verify callback', () => {
    expect(() => {
      const s = new Strategy({});
    }).to.throw('AppleVerifyTokenStrategy requires a verify function');
  });

  function performValidTokenTest(strategyObject: any, reqFunction: any) {
    let user: any;
    let info: any;

    before(done => {
      chaiPassport.passport
        .use(strategyObject)
        .success((u: any, i: any) => {
          user = u;
          info = i;
          done();
        })
        .req(reqFunction)
        .authenticate();
    });

    it('should supply user', () => {
      expect(user).to.be.an('object');
      expect(user.id).to.equal('1234');
    });

    it('should supply info', () => {
      expect(info).to.be.an('object');
      expect(info.scope).to.equal('read');
    });
  }

  describe('handling a request with id_token as query parameter', () => {
    performValidTokenTest(strategy, (req: any) => {
      req.query = { id_token: mockToken };
    });
  });

  describe('handling a request with access_token as query parameter', () => {
    performValidTokenTest(strategy, (req: any) => {
      req.query = { access_token: mockToken };
    });
  });

  describe('handling a request with id_token as body parameter', () => {
    performValidTokenTest(strategy, (req: any) => {
      req.body = { id_token: mockToken };
    });
  });

  describe('handling a request with access_token as body parameter', () => {
    performValidTokenTest(strategy, (req: any) => {
      req.body = { access_token: mockToken };
    });
  });

  describe('handling a request with bearer token in authorization header', () => {
    performValidTokenTest(strategy, (req: any) => {
      req.headers = { authorization: 'Bearer ' + mockToken };
    });
  });

  describe('handling a valid request with clientID array in strategy options', () => {
    performValidTokenTest(strategyWClientIDArray, (req: any) => {
      req.body = { access_token: mockToken };
    });
  });

  // Failing tests
  function performFailTokenTest(strategyObject: any, reqFunction: any) {
    let error: any;

    before(done => {
      chaiPassport.passport
        .use(strategyObject)
        .fail((u: any) => {
          error = u;
          done();
        })
        .req(reqFunction)
        .authenticate();
    });

    it('should error object exists', () => {
      expect(error).to.be.an('object');
    });
  }

  describe('handling a request with no id token', () => {
    performFailTokenTest(strategy, (req: any) => {
      return;
    });
  });

  describe('handling a valid request with error', () => {
    performFailTokenTest(strategyTokenError, (req: any) => {
      req.body = { access_token: mockToken };
    });
  });

  describe('handling a valid request with no parsed token', () => {
    performFailTokenTest(strategyNoParsedToken, (req: any) => {
      req.body = { access_token: mockToken };
    });
  });
});
