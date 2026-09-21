import { defineConfig } from 'orval'

export default defineConfig({
  shorebird: {
    input: './src/api/openapi.yaml',
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/models',
      client: 'vue-query',
      prettier: true,
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
      },
    },
  },
  shorebirdZod: {
    input: './src/api/openapi.yaml',
    output: {
      mode: 'tags-split',
      target: './src/api/generated/zod',
      client: 'zod',
      prettier: true,
    },
  },
})
