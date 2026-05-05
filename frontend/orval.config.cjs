module.exports = {
  api: {
    input: '../docs/api/openapi.yaml',
    output: {
      mode: 'single',
      target: 'src/api/generated/orvalClient.ts',
      client: 'fetch',
    },
  },
};
