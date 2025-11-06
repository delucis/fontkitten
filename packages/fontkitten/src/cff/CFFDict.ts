// import isEqual from 'fast-deep-equal';
import CFFOperand from './CFFOperand';
import { PropertyDescriptor } from '@fontkitten/restructure';

export default class CFFDict {
  constructor(ops = []) {
    this.ops = ops;
    this.fields = {};
    for (let field of ops) {
      let key = Array.isArray(field[0]) ? field[0][0] << 8 | field[0][1] : field[0];
      this.fields[key] = field;
    }
  }

  decodeOperands(type, stream, ret, operands) {
    if (Array.isArray(type)) {
      return operands.map((op, i) => this.decodeOperands(type[i], stream, ret, [op]));
    } else if (type.decode != null) {
      return type.decode(stream, ret, operands);
    } else {
      switch (type) {
        case 'number':
        case 'offset':
        case 'sid':
          return operands[0];
        case 'boolean':
          return !!operands[0];
        default:
          return operands;
      }
    }
  }

  decode(stream, parent) {
    let end = stream.pos + parent.length;
    let ret = {};
    let operands = [];

    // define hidden properties
    Object.defineProperties(ret, {
      parent:         { value: parent },
      _startOffset:   { value: stream.pos }
    });

    // fill in defaults
    for (let key in this.fields) {
      let field = this.fields[key];
      ret[field[1]] = field[3];
    }

    while (stream.pos < end) {
      let b = stream.readUInt8();
      if (b < 28) {
        if (b === 12) {
          b = (b << 8) | stream.readUInt8();
        }

        let field = this.fields[b];
        if (!field) {
          throw new Error(`Unknown operator ${b}`);
        }

        let val = this.decodeOperands(field[2], stream, ret, operands);
        if (val != null) {
          if (val instanceof PropertyDescriptor) {
            Object.defineProperty(ret, field[1], val);
          } else {
            ret[field[1]] = val;
          }
        }

        operands = [];
      } else {
        operands.push(CFFOperand.decode(stream, b));
      }
    }

    return ret;
  }
}
