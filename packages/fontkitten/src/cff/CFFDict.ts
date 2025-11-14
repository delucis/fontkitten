import CFFOperand from './CFFOperand';
import { type DecodeStream, PropertyDescriptor } from '@fontkitten/restructure';

export default class CFFDict {
  declare fields: Record<number, any>;

  constructor(public ops: any[] = []) {
    this.fields = Object.fromEntries(ops.map(field => {
      const key = Array.isArray(field[0]) ? field[0][0] << 8 | field[0][1] : field[0];
      return [key, field];
    }));
  }

  decodeOperands(type, stream: DecodeStream, ret, operands: any[]) {
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

  decode(stream: DecodeStream, parent: any) {
    const end = stream.pos + parent.length;
    const ret: Record<string, any> = {};
    let operands: any[] = [];

    // define hidden properties
    Object.defineProperties(ret, {
      parent:         { value: parent },
      _startOffset:   { value: stream.pos }
    });

    // fill in defaults
    for (const key in this.fields) {
      const field = this.fields[key];
      ret[field[1]] = field[3];
    }

    while (stream.pos < end) {
      let b = stream.readUInt8();
      if (b < 28) {
        if (b === 12) {
          b = (b << 8) | stream.readUInt8();
        }

        const field = this.fields[b];
        if (!field) {
          throw new Error(`Unknown operator ${b}`);
        }

        const val = this.decodeOperands(field[2], stream, ret, operands);
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
