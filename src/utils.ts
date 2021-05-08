export function isIterable<T>(testSubject: object): testSubject is Iterable<T> {
  return typeof testSubject[Symbol.iterator] === 'function';
}

export function isAsyncIterable<T>(testSubject: object): testSubject is AsyncIterable<T> {
  return typeof testSubject[Symbol.asyncIterator] === 'function';
}

export function isPromise<T>(obj: any): obj is Promise<T> {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}
// export function isPromise(obj: any): boolean {
//   return (
//     !!obj &&
//     (typeof obj === 'object' || typeof obj === 'function') &&
//     typeof obj.then === 'function'
//   );
// }

export function isGeneratorFunction(testSub: any): testSub is Generator {
  return testSub && typeof testSub.next === 'function' && isIterable(testSub);
}

export function isAsyncGeneratorFunction(testSub: any): testSub is AsyncGenerator {
  return (
    testSub && typeof testSub.next === 'function' && isAsyncIterable(testSub)
  );
}

export const GeneratorFunction = function* () {}.constructor;
export const AsyncFunction = async function () {}.constructor;