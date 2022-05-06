import { Resolver } from 'webpack';
import { mock, mockFn } from 'jest-mock-extended';
import path from 'path';

import { PatchPnpResolver } from '../../src/patchPnpResolver';
import { ulid } from 'ulid';

type ResolveTapAsyncParams = Parameters<Resolver['hooks']['resolve']['tapAsync']>[1];
type ResolveRequest = Parameters<ResolveTapAsyncParams>[0];
type ResolveContext = Parameters<ResolveTapAsyncParams>[1];
type ResolveCallback = Parameters<ResolveTapAsyncParams>[2];

const projectDir = `${path.resolve(__dirname, '../..')}/`;

const resolver = mock<Resolver>();
const ensureHook = mockFn<Resolver['ensureHook']>();
const getHook = mockFn<Resolver['getHook']>();
const doResolve = mockFn<Resolver['doResolve']>();

const resolveHook = mock<Resolver['hooks']['resolve']>();

const afterResolveHook = mock<Resolver['hooks']['resolve']>();
const tapAsync = mockFn<Resolver['hooks']['resolve']['tapAsync']>();

const callback = mockFn<ResolveCallback>();

let patch: PatchPnpResolver;

beforeEach(() => {
  patch = new PatchPnpResolver();
  resolver.ensureHook = ensureHook;
  resolver.getHook = getHook;
  resolver.doResolve = doResolve;

  ensureHook.mockReturnValue(resolveHook);
  getHook.mockReturnValue(afterResolveHook);
  afterResolveHook.tapAsync = tapAsync;
});

const getTapAsyncCallBack = (call: number) => {
  expect(getHook).toBeCalledWith('after-resolve');
  expect(tapAsync).toBeCalledWith('PatchPnpResolver', expect.any(Function));
  const [, tapAsyncCallback] = tapAsync.mock.calls[call];
  return tapAsyncCallback;
};

test('PatchPnpResolver will resolve directories', async () => {
  const resolveRequest: ResolveRequest = {
    path : __dirname,
    request : '../testProject1',
  };
  const resolveContext: ResolveContext = {};

  expect(() => patch.apply(resolver)).not.toThrow();
  const tapAsyncCallback = getTapAsyncCallBack(0);

  tapAsyncCallback(resolveRequest, resolveContext, callback);
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(callback).toBeCalledWith(null, {
    path: path.resolve(__dirname, '../testProject1'),
    fragment: '',
    query: '',
  });
});

test.each<ResolveRequest>([
  { path: __dirname },
  { path: false, request: 'index.ts' },
  { path: __dirname, request: 'index.ts' },
  { path: `/fake/root/${ulid()}`, request: 'index.ts' },
])('PatchPnpResolver will try the path from the project %#', async (resolveRequest) => {
  const resolveContext: ResolveContext = {};

  expect(() => patch.apply(resolver)).not.toThrow();
  const tapAsyncCallback = getTapAsyncCallBack(0);

  tapAsyncCallback(resolveRequest, resolveContext, callback);

  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(doResolve).toBeCalledWith(
    resolveHook,
    expect.objectContaining({
      path: projectDir,
    }),
    null,
    expect.objectContaining({
      path: projectDir,
    }),
    callback,
  );
});
