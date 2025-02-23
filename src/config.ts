import {
  IntegrationExecutionContext,
  IntegrationValidationError,
  IntegrationInstanceConfigFieldMap,
  IntegrationInstanceConfig,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from './client';

/**
 * A type describing the configuration fields required to execute the
 * integration for a specific account in the data provider.
 *
 * When executing the integration in a development environment, these values may
 * be provided in a `.env` file with environment variables. For example:
 *
 * - `CLIENT_ID=123` becomes `instance.config.clientId = '123'`
 * - `CLIENT_SECRET=abc` becomes `instance.config.clientSecret = 'abc'`
 *
 * Environment variables are NOT used when the integration is executing in a
 * managed environment. For example, in JupiterOne, users configure
 * `instance.config` in a UI.
 */
export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  baseUrl: {
    type: 'string',
  },
  device42Username: {
    type: 'string',
  },
  password: {
    type: 'string',
    mask: true,
  },
};

/**
 * Properties provided by the `IntegrationInstance.config`. This reflects the
 * same properties defined by `instanceConfigFields`.
 */
export interface IntegrationConfig extends IntegrationInstanceConfig {
  device42Username: string;
  password: string;
  baseUrl: string;
}

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  if (!config.device42Username || !config.password || !config.baseUrl) {
    throw new IntegrationValidationError(
      'Config requires all of {device42Username, password, baseUrl}',
    );
  }

  if (config.disableTlsVerification) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    context.logger.warn(
      `Disabling TLS certificate verification based on .env.  If possible, please install valid TLS certificates into Device42 server.`,
    );
    context.logger.publishEvent({
      name: 'disable_tls_verify',
      description:
        'Disabling TLS certificate verification. NOT RECOMMENDED: If possible, please install valid TLS certificates into Device42 server.',
    });
  }

  const apiClient = createAPIClient(config);
  await apiClient.verifyAuthentication();
}
