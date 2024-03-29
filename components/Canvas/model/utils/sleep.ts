/**
 * 回傳一個需要 ms 毫秒才會 resolve 的 Promise
 */
function sleep(ms: number): Promise<void>;
function sleep<T>(ms: number, value: T): Promise<T>;
function sleep<T>(ms: number, value?: T): Promise<T | void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

export default sleep;