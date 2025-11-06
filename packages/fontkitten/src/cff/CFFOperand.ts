const FLOAT_EOF = 0xf;
const FLOAT_LOOKUP = [
  '0', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', '.', 'E', 'E-', null, '-'
];

const FLOAT_ENCODE_LOOKUP = {
  '.': 10,
  'E': 11,
  'E-': 12,
  '-': 14
};

export default class CFFOperand {
  static decode(stream, value) {
    if (32 <= value && value <= 246) {
      return value - 139;
    }

    if (247 <= value && value <= 250) {
      return (value - 247) * 256 + stream.readUInt8() + 108;
    }

    if (251 <= value && value <= 254) {
      return -(value - 251) * 256 - stream.readUInt8() - 108;
    }

    if (value === 28) {
      return stream.readInt16BE();
    }

    if (value === 29) {
      return stream.readInt32BE();
    }

    if (value === 30) {
      let str = '';
      while (true) {
        let b = stream.readUInt8();

        let n1 = b >> 4;
        if (n1 === FLOAT_EOF) { break; }
        str += FLOAT_LOOKUP[n1];

        let n2 = b & 15;
        if (n2 === FLOAT_EOF) { break; }
        str += FLOAT_LOOKUP[n2];
      }

      return parseFloat(str);
    }

    return null;
  }
}
