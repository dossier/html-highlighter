// @flow

export type PromiseCapabilities = {| instance: Promise<*>, resolve: any => any, fail: any => any |};

function abstract() {
  throw new Error('Abstract method not implemented');
}

function createPromiseCapabilities(): PromiseCapabilities {
  let resolve, fail;
  const instance = new Promise((pr, pf) => {
    resolve = pr;
    fail = pf;
  });

  // $FlowFixMe: `resolve` and `fail` are defined at this point
  return {
    instance,
    resolve,
    fail,
  };
}

export { abstract, createPromiseCapabilities };
