import nock from 'nock';

export function mockRevelor(baseUrl = 'https://test.revelor.cz') {
  return nock(baseUrl);
}

export function cleanup() {
  nock.cleanAll();
}
