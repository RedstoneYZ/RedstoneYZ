/**
 * 遞迴地比較兩個變數是否完全相等，對於物件僅考慮可枚舉的屬性
 */
function strictEqual(thing1: any, thing2: any) {
  if (typeof thing1 === 'number' && typeof thing2 === 'number' && isNaN(thing1) && isNaN(thing2)) {
    return true;
  }
  if (typeof thing1 !== 'object' || typeof thing2 !== 'object') {
    return thing1 === thing2;
  }
  if (thing1 === null || thing2 === null) {
    return thing1 === thing2;
  }

  if (Object.keys(thing1).length !== Object.keys(thing2).length) {
    return false;
  }
  for (const key in thing1) {
    if (!strictEqual(thing1[key], thing2[key])) {
      return false;
    }
  }
  return true;
}

export default strictEqual;