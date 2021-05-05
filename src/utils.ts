export function isIterable(testSubject: object): boolean {
  return typeof testSubject[Symbol.iterator] === 'function';
}

export function isAsyncIterable(testSubject: object) {
  return typeof testSubject[Symbol.asyncIterator] === 'function';
}

export function isPromise(obj: any): boolean {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

export function isGeneratorFunction(testSub: any): boolean {
  return testSub && typeof testSub.next === 'function' && isIterable(testSub);
}

export function isAsyncGeneratorFunction(testSub: any): boolean {
  return (
    testSub && typeof testSub.next === 'function' && isAsyncIterable(testSub)
  );
}

export const GeneratorFunction = function* () {}.constructor;
export const AsyncFunction = async function () {}.constructor;