export type State = string | number | symbol;

type AsyncFSMArgs<S extends State, D = undefined> = Record<
S,
(data: D, current: S) => S
>;

async function* createAsyncFSM(args: AsyncFSMArgs<string>): AsyncGenerator {
  const result = yield 'some state'; // result is the arg in asyncFSM.next('nextState');

  return result;
}