import type { Json } from '@metamask/utils';
import {
  JsonRpcMiddleware,
  AsyncJsonRpcEngineNextCallback,
  createAsyncMiddleware,
  PendingJsonRpcResponse,
  JsonRpcRequest,
} from 'json-rpc-engine';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JsonRpcEngine } from 'json-rpc-engine';
import { internalError } from './errors';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PermissionController } from './PermissionController';
import {
  GenericPermissionController,
  PermissionSubjectMetadata,
  RestrictedMethodParameters,
} from '.';

type PermissionMiddlewareFactoryOptions = {
  executeRestrictedMethod: GenericPermissionController['_executeRestrictedMethod'];
  getRestrictedMethod: GenericPermissionController['getRestrictedMethod'];
  isUnrestrictedMethod: (method: string) => boolean;
};

/**
 * Creates a permission middleware function factory. Intended for internal use
 * in the {@link PermissionController}. Like any {@link JsonRpcEngine}
 * middleware, each middleware will only receive requests from a particular
 * subject / origin. However, each middleware also requires access to some
 * `PermissionController` internals, which is why this "factory factory" exists.
 *
 * The middlewares returned by the factory will pass through requests for
 * unrestricted methods, and attempt to execute restricted methods. If a method
 * is neither restricted nor unrestricted, a "method not found" error will be
 * returned.
 * If a method is restricted, the middleware will first attempt to retrieve the
 * subject's permission for that method. If the permission is found, the method
 * will be executed. Otherwise, an "unauthorized" error will be returned.
 *
 * @param options - Options bag.
 * @param options.executeRestrictedMethod - {@link PermissionController._executeRestrictedMethod}.
 * @param options.getRestrictedMethod - {@link PermissionController.getRestrictedMethod}.
 * @param options.isUnrestrictedMethod - A function that checks whether a
 * particular method is unrestricted.
 * @returns A permission middleware factory function.
 */
export function getPermissionMiddlewareFactory({
  executeRestrictedMethod,
  getRestrictedMethod,
  isUnrestrictedMethod,
}: PermissionMiddlewareFactoryOptions) {
  return function createPermissionMiddleware(
    subject: PermissionSubjectMetadata,
  ): JsonRpcMiddleware<RestrictedMethodParameters, Json> {
    const { origin } = subject;
    if (typeof origin !== 'string' || !origin) {
      throw new Error('The subject "origin" must be a non-empty string.');
    }

    const permissionsMiddleware = async (
      req: JsonRpcRequest<RestrictedMethodParameters>,
      res: PendingJsonRpcResponse<Json>,
      next: AsyncJsonRpcEngineNextCallback,
    ): Promise<void> => {
      const { method, params } = req;

      // Skip registered unrestricted methods.
      if (isUnrestrictedMethod(method)) {
        return next();
      }

      // This will throw if no restricted method implementation is found.
      const methodImplementation = getRestrictedMethod(method, origin);

      // This will throw if the permission does not exist.
      const result = await executeRestrictedMethod(
        methodImplementation,
        subject,
        method,
        params,
      );

      if (result === undefined) {
        res.error = internalError(
          `Request for method "${req.method}" returned undefined result.`,
          { request: req },
        );
        return undefined;
      }

      res.result = result;
      return undefined;
    };

    return createAsyncMiddleware(permissionsMiddleware);
  };
}
