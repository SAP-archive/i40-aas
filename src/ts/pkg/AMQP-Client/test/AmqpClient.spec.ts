import { AmqpClient } from '../src/AmqpClient';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

// Then either:
var expect = chai.expect;
// or:
//var assert = chai.assert;
// or:
chai.should();

describe('AmqpClient', function() {
  it('sleeps for the appropriate time', async function() {
    let start = Date.now();
    await AmqpClient.sleep(500);
    let end = Date.now();
    expect(end - start).to.below(510);
  });
});
