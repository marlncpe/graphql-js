/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { describe, it } from 'mocha';
import { expectPassesRule, expectFailsRule } from './harness';
import KnownArgumentNames from '../rules/KnownArgumentNames';
import { unknownArgMessage } from '../errors';

function unknownArg(argName, fieldName, typeName, line, column) {
  return {
    message: unknownArgMessage(argName, fieldName, typeName),
    locations: [ { line, column } ],
  };
}

describe('Validate: Known argument names', () => {

  it('single arg is known', () => {
    expectPassesRule(KnownArgumentNames, `
      fragment argOnRequiredArg on Dog {
        doesKnowCommand(dogCommand: SIT)
      }
    `);
  });

  it('multiple args are known', () => {
    expectPassesRule(KnownArgumentNames, `
      fragment multipleArgs on ComplicatedArgs {
        multipleReqs(req1: 1, req2: 2)
      }
    `);
  });

  it('multiple args in reverse order are known', () => {
    expectPassesRule(KnownArgumentNames, `
      fragment multipleArgsReverseOrder on ComplicatedArgs {
        multipleReqs(req2: 2, req1: 1)
      }
    `);
  });

  it('no args on optional arg', () => {
    expectPassesRule(KnownArgumentNames, `
      fragment noArgOnOptionalArg on Dog {
        isHousetrained
      }
    `);
  });

  it('args are known deeply', () => {
    expectPassesRule(KnownArgumentNames, `
      {
        dog {
          doesKnowCommand(dogCommand: SIT)
        }
        human {
          pet {
            ... on Dog {
              doesKnowCommand(dogCommand: SIT)
            }
          }
        }
      }
    `);
  });

  it('invalid arg name', () => {
    expectFailsRule(KnownArgumentNames, `
      fragment invalidArgName on Dog {
        doesKnowCommand(unknown: true)
      }
    `, [
      unknownArg('unknown', 'doesKnowCommand', 'Dog', 3, 25),
    ]);
  });

  it('unknown args amongst known args', () => {
    expectFailsRule(KnownArgumentNames, `
      fragment oneGoodArgOneInvalidArg on Dog {
        doesKnowCommand(whoknows: 1, dogCommand: SIT, unknown: true)
      }
    `, [
      unknownArg('whoknows', 'doesKnowCommand', 'Dog', 3, 25),
      unknownArg('unknown', 'doesKnowCommand', 'Dog', 3, 55),
    ]);
  });

  it('unknown args deeply', () => {
    expectFailsRule(KnownArgumentNames, `
      {
        dog {
          doesKnowCommand(unknown: true)
        }
        human {
          pet {
            ... on Dog {
              doesKnowCommand(unknown: true)
            }
          }
        }
      }
    `, [
      unknownArg('unknown', 'doesKnowCommand', 'Dog', 4, 27),
      unknownArg('unknown', 'doesKnowCommand', 'Dog', 9, 31),
    ]);
  });

  it('args may be on object but not interface', () => {
    expectFailsRule(KnownArgumentNames, `
      fragment nameSometimesHasArg on Being {
        name(surname: true)
        ... on Human {
          name(surname: true)
        }
        ... on Dog {
          name(surname: true)
        }
      }
    `, [
      unknownArg('surname', 'name', 'Being', 3, 14),
      unknownArg('surname', 'name', 'Dog', 8, 16)
    ]);
  });

});
